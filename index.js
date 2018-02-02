'use strict';
const dbus = require('dbus-native');
const EventEmitter = require('events');
const {promisify} = require('util');

/**
 * Client for systemd-timedated
 */
class TimeDateService extends EventEmitter {
    
    /**
     * Connects to the timedate daemon
     */
    async connect() {
        if(this._connecting) return this._connecting;
        if(this._timedateService) return this;
        
        const service = dbus.systemBus().getService('org.freedesktop.timedate1');
        this._connecting = Promise.all([new Promise((resolve, reject) => {
                service.getInterface('/org/freedesktop/timedate1', 'org.freedesktop.DBus.Properties', (err, bus) => {
                    if(err) return reject(err);
                    bus.on('PropertiesChanged', this._onChange.bind(this));
                    resolve();
                })
            }), new Promise((resolve, reject) => {
                service.getInterface('/org/freedesktop/timedate1', 'org.freedesktop.timedate1', (err, bus) => {
                    if(err) return reject(err);
                    this._promisifyProperties(bus);
                    this._timedateService = bus;
                    resolve();
                });
            })
        ]);
        try {
            await this._connecting;
        } catch(e) {
            delete this._connecting;
            delete this._timedateService;
            throw e;
        }
        return this;
    }
    
    /**
     * Gets the current time
     * @returns {Date} A Date object representing now
     */
    async getTime() {
        const timeusec = await this._timedateService.getTimeUSec();
        return new Date(timeusec/1000);
    }
    
    /**
     * Gets the current Timezone
     * @returns {string} The selected timezone
     */
    async getTimezone() {
        return this._timedateService.getTimezone();
    }
    
    /**
     * Returns true when the time is in-sync with the upstream NTP server
     * @returns {boolean} true when the time is in-sync
     */
    async getNTPSynchronized() {
        return this._timedateService.getNTPSynchronized();
    }
    
    /**
     * Returns true if an NTP service is available
     * @returns {boolean} true if the service is available
     */
    async getCanNTP() {
        return this._timedateService.getCanNTP();
    }
    
    /**
     * Returns true when NTP sync is enabled
     * @returns {boolean} true when NTP sync is enabled
     */
    async getNTP() {
        return this._timedateService.getNTP();
    }
    
    
    
    /**
     * Sets the current time. Requires NTP to be turned off
     * @param {Date|Number} time - the new time
     */
    async setTime(time) {
        return this._timedateService.SetTime(time*1000, false, false);
    }
    
    /**
     * Sets the current timezone
     * @param {string} timezone - the IANA timezone identifier such as "Europe/Amsterdam"
     */
    async setTimezone(timezone) {
        return this._timedateService.SetTimezone(timezone, false);
    }
    
    /**
     * Enables or disables NTP
     * @param {boolean} useNtp - true to enable NTP
     */
    async setNTP(use_ntp) {
        return this._timedateService.SetNTP(use_ntp, false);
    }

    
    _onChange(interfaceName, changedProperties, invalidatedProperties) {
        if(interfaceName !== 'org.freedesktop.timedate1') return;
        const tz = changedProperties.filter(entry => entry[0] === 'Timezone').pop();
        if(tz) this._onTimezoneChanged(tz[1][1][0]);
        const ntp = changedProperties.filter(entry => entry[0] === 'NTP').pop();
        if(ntp) this._onNTPChanged(ntp[1][1][0]);
    }
    
    _onTimezoneChanged(timezone) {
        this.emit('timezoneChange', timezone);
    }
    
    _onNTPChanged(ntp) {
        this.emit('NTPChange', ntp);
    }
    
    _promisifyProperties(service) {
        Object.getOwnPropertyNames(service).forEach(key => {
            if(this[key]) return;
            const desc = Object.getOwnPropertyDescriptor(service, key);
            if(desc.get && typeof desc.get == 'function') {
                service['get'+key] = async () => new Promise((resolve, reject) => {
                    service[key]((err, res) => {
                        if(err) return reject(err);
                        resolve(res);
                    });
                });
            } else if(desc.value && typeof desc.value === 'function') {
                service[key] = promisify(desc.value);
            }
        });
    }
    
}

module.exports = TimeDateService;