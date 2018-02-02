'use strict';
const TimeDateService = require('..');
const service = new TimeDateService();


async function printData(...args) {
    
    const [date, tz, canNtp, NTPenabled, NTPinSync] = 
        await Promise.all([
        service.getTime(),
        service.getTimezone(),
        service.getCanNTP(),
        service.getNTP(),
        service.getNTPSynchronized()
    ]);
    
    if(args.length > 0) console.log(...args);
    console.log('Date/time:', date.toLocaleString());
    console.log('Timezone:', tz);
    console.log('NTP available:', canNtp);
    console.log('NTP enabled:', NTPenabled);
    console.log('NTP in sync:', NTPinSync);
    console.log('');
}


async function test() { 
    
    service.on('timezoneChange', tz => printData('Timezone changed:', tz));
    service.on('NTPChange', ntp => printData('NTP changed:', ntp));
    
    await service.connect();
    
    printData('connected...');
    
    await service.setTimezone('Europe/Amsterdam');
}

test();