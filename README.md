# systemd-timedated-client


*systemd-timedated-client* provides a client to access the systemd-timedated API.


## Install
    
Add the systemd-timedated-client module as dependency to your package.json and/or run npm install


## Library Usage
The API documentation can be found [here](https://athombv.github.io/node-systemd-timedated-client/TimeDateService.html).

```js
const service = new TimeDateService();

async function printData() {
    
    const [date, tz, canNtp, NTPenabled, NTPinSync] = 
        await Promise.all([
        service.getTime(),
        service.getTimezone(),
        service.getCanNTP(),
        service.getNTP(),
        service.getNTPSynchronized()
    ]);
    
    console.log('Date/time:', date.toLocaleString());
    console.log('Timezone:', tz);
    console.log('NTP available:', canNtp);
    console.log('NTP enabled:', NTPenabled);
    console.log('NTP in sync:', NTPinSync);
    console.log('');
}


async function test() { 
    
    service.on('timezoneChange', tz => console.log('new TZ:', tz));
    service.on('NTPChange', ntp => console.log('NTP state:', ntp));
    
    await service.connect();
    
    printData();
    
    await service.setTimezone('Europe/Amsterdam');
}

test();
```
