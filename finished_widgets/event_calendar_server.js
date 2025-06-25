(function() {
  data.events = [];
  
  var now = new GlideDateTime();
  var year = now.getYearLocalTime();
  
  var processedHolidays = {};
  
  var scheduleSysId = '05c8a4b247f15a10d4fddf8c416d43bd'; 
  var gr = new GlideRecord('cmn_schedule_span');
  gr.addQuery('schedule', scheduleSysId);
  gr.addQuery('type', 'exclude');
  gr.query();

  while (gr.next()) {
    var name = gr.getValue('name');
    var startRaw = gr.getValue('start_date_time');
    var endRaw = gr.getValue('end_date_time');
    var region = gr.getValue('u_region');

    if (!startRaw || startRaw.length < 8) continue;

    var cleanName = name.trim();
    var mmdd = startRaw.substring(4, 8); 
    var startDate = year + mmdd + "000000"; 
    var endDate = year + mmdd + "235959"; 
    
    var holidayKey = cleanName + '|' + mmdd + '|' + region;
    
    if (processedHolidays[holidayKey]) continue;
    processedHolidays[holidayKey] = true;

    data.events.push({
      title: cleanName,
      event_date: startDate,
      event_end: endDate,
      sys_id: gr.getUniqueValue(),
      source: 'holiday',
      region: region
    });
  }
  
  var processedPortalEvents = {};
  
  var contentTypeId = '3893597a0b4303008cd6e7ae37673a4c';
  var portalGr = new GlideRecord('sn_cd_content_portal');
  portalGr.addQuery('content_type', contentTypeId);
	portalGr.addQuery('active', true);
  portalGr.query();
  
  while (portalGr.next()) {
    var title = portalGr.getValue('title') || portalGr.getValue('name') || 'Event';
    var eventStart = portalGr.getValue('event_start');
    var eventEnd = portalGr.getValue('event_end');
    var richText = portalGr.getValue('rich_text') || '';
    
    var startDate = eventStart;
    var endDate = eventEnd;
    
    if (!startDate) {
      startDate = portalGr.getValue('start_date') || portalGr.getValue('date');
    }
    if (!endDate && startDate) {
      endDate = portalGr.getValue('end_date') || startDate;
    }
    
    if (startDate) {
      if (startDate.indexOf('-') > -1 || startDate.indexOf(' ') > -1) {
        var startGdt = new GlideDateTime(startDate);
        startDate = startGdt.getValue().replace(/[-:\s]/g, '');
      }
      
      if (endDate && (endDate.indexOf('-') > -1 || endDate.indexOf(' ') > -1)) {
        var endGdt = new GlideDateTime(endDate);
        endDate = endGdt.getValue().replace(/[-:\s]/g, '');
      }
      
      if (startDate.length >= 8) {
        var cleanTitle = title.trim();
        var portalKey = cleanTitle + '|' + startDate + '|' + (endDate || '');
        
        if (processedPortalEvents[portalKey]) continue;
        processedPortalEvents[portalKey] = true;
        
        data.events.push({
          title: cleanTitle,
          event_date: startDate,
          event_end: endDate,
          rich_text: richText,
          sys_id: portalGr.getUniqueValue(),
          source: 'content_portal',
          event_type: portalGr.getValue('u_event_type') || '',
          region: ''
        });
      }
    }
  }
})();
