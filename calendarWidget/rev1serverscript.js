(function() {
    data.async = true;
    if (!input || input.action != "loadData")
        return;

    data.CONST = {
        TEXT: {
            ADD_ALL_EVENTS: gs.getMessage('Add all events to calendar')
        }
    };

    data.thisYearItems = [];
    data.nextYearItems = [];
    data.regions = [];

    var fixedScheduleSysId = '05c8a4b247f15a10d4fddf8c416d43bd';

    getCalendarData(fixedScheduleSysId);
    getRegions();

    if (data.isContentPreview && data.thisYearItems.length + data.nextYearItems.length === 0)
        gs.addErrorMessage(gs.getMessage("{0}: Content could not be previewed due to being scheduled in the past, or too far in the future", data.title));

    function getCalendarData(scheduleSysId) {
        var gr = new GlideRecord("cmn_schedule");
        if (gr.get(scheduleSysId)) { 
            data.calSysId = gr.getUniqueValue();
            var start = new GlideDateTime(); 
            var end = new GlideDateTime();
            end.setMonthLocalTime(12);
            end.setDayOfMonthLocalTime(31); 
            data.thisYear = start.getYearLocalTime();
            calculateSpans(data.thisYearItems, gr, start, end);

            start.addYearsLocalTime(1);
            start.setMonthLocalTime(1);
            start.setDayOfMonthLocalTime(1); 
            end.addYearsLocalTime(1); 
            data.nextYear = end.getYearLocalTime();
            calculateSpans(data.nextYearItems, gr, start, end);
        }
    }

    function calculateSpans(items, schedule, start, end) {
        var calSysId = schedule.sys_id.toString();
        var timeSpan = new GlideRecord('cmn_schedule_span');
        timeSpan.addQuery('schedule', schedule.sys_id);
        timeSpan.query();
        while (timeSpan.next()) {
            var spanTZ;
            if (timeSpan.schedule && timeSpan.schedule.time_zone)
                spanTZ = timeSpan.schedule.time_zone;
            else
                spanTZ = gs.getSession().getTimeZoneName();

            var scheduleSpan = new GlideScheduleTimeSpan(timeSpan, spanTZ);
            var timeSpans = scheduleSpan.getSpans(new GlideScheduleDateTime(start), new GlideScheduleDateTime(end));

            for (var i = 0; i < timeSpans.length; i++) {
                var dateTime = timeSpans[i].getStart().getGlideDateTime();
                var yearText = dateTime.getDate().getByFormat("YYYY");

                items.push({
                    name: scheduleSpan.getName(),
                    date: dateTime.getLocalDate().getDisplayValue(),
                    day: gs.getMessage(dateTime.getLocalDate().getByFormat('EEE')),
                    numeric: dateTime.getNumericValue(),
                    yearText: yearText,
                    sysId: calSysId,
                    region: timeSpan.u_region.toString().trim().toLowerCase() // Normalize region
                });
            }
        }
    }

function getRegions() {
    var gr = new GlideRecord('cmn_schedule_span');
    gr.addNotNullQuery('u_region'); 
    gr.query();
    var addedRegions = {}; 
    while (gr.next()) {
        var regionNameNormalized = gr.u_region.toString().trim().toLowerCase();
        var regionNameDisplay = gr.u_region.toString().trim(); // Preserve original case
        if (regionNameNormalized !== '' && !addedRegions[regionNameNormalized]) {
            data.regions.push({
                sys_id: gr.sys_id.toString(),
                u_region: regionNameDisplay, // Use display version
                normalized_region: regionNameNormalized // Keep normalized for filtering
            });
            addedRegions[regionNameNormalized] = true; 
        }
    }
}


})();
