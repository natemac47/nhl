function($scope) {
  var c = this;
  c.today = new Date();
  c.baseDate = new Date(c.today);
  c.viewMode = null;
  c.monthOrWeekDays = null;
  c.yearMonths = null;
  c.selectedEventType = '';
  c.selectedLocation = '';
  c.filteredSpanningEvents = [];
  c.availableLocations = [];
  c.showEventModal = false;
  c.selectedEvent = null;
  c.searchQuery = '';
  c.searchResults = [];
  c.showSearchDropdown = false;
  c.currentDisplayMode = 'calendar';
  c.sortColumn = 'date';
  c.sortDirection = 'asc';

  c.events = $scope.data.events || [];
  c.eventsByDate = {};
  c.multiDayEvents = [];
  c.multiDayEventsByDate = {};

  var processedEvents = new Set();

  c.toggleDisplayMode = function(mode) {
    c.currentDisplayMode = mode;
    if (mode === 'list') {
      c.prepareListView();
    }
  };

  c.prepareListView = function() {
    c.listEvents = c.filterEvents(c.events).map(function(event) {
      return {
        title: event.title,
        event_date: event.event_date,
        event_end: event.event_end,
        source: event.source,
        event_type: event.event_type,
        rich_text: event.rich_text,
        sys_id: event.sys_id,
        region: event.region,
        formattedDate: c.formatEventDate(event.event_date),
        sortDate: c.getSortableDate(event.event_date)
      };
    });
    
    c.sortListEvents();
  };

  c.getSortableDate = function(dateStr) {
    if (!dateStr || dateStr.length < 8) return new Date(0);
    
    var year = dateStr.substring(0, 4);
    var month = dateStr.substring(4, 6);
    var day = dateStr.substring(6, 8);
    var hour = dateStr.length >= 10 ? dateStr.substring(8, 10) : '00';
    var minute = dateStr.length >= 12 ? dateStr.substring(10, 12) : '00';
    
    return new Date(year, month - 1, day, hour, minute);
  };

  c.sortBy = function(column) {
    if (c.sortColumn === column) {
      c.sortDirection = c.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      c.sortColumn = column;
      c.sortDirection = 'asc';
    }
    c.sortListEvents();
  };

  c.sortListEvents = function() {
    if (!c.listEvents) return;
    
    c.listEvents.sort(function(a, b) {
      var aValue, bValue;
      
      if (c.sortColumn === 'title') {
        aValue = a.title.toLowerCase();
        bValue = b.title.toLowerCase();
      } else if (c.sortColumn === 'date') {
        aValue = a.sortDate.getTime();
        bValue = b.sortDate.getTime();
      }
      
      if (c.sortDirection === 'asc') {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
      }
    });
  };

  c.getSortIcon = function(column) {
    if (c.sortColumn !== column) return '';
    return c.sortDirection === 'asc' ? '▲' : '▼';
  };

  c.searchEvents = function() {
    if (!c.searchQuery || c.searchQuery.length < 2) {
      c.searchResults = [];
      c.showSearchDropdown = false;
      return;
    }

    var query = c.searchQuery.toLowerCase();
    c.searchResults = c.events.filter(function(event) {
      return event.source === 'content_portal' && 
             event.title.toLowerCase().indexOf(query) !== -1;
    }).slice(0, 10);

    c.showSearchDropdown = c.searchResults.length > 0;
  };

  c.selectSearchResult = function(event) {
    c.searchQuery = event.title;
    c.showSearchDropdown = false;
    c.openEventModal(event);
  };

  c.hideSearchDropdown = function() {
    setTimeout(function() {
      $scope.$apply(function() {
        c.showSearchDropdown = false;
      });
    }, 200);
  };

  c.clearSearch = function() {
    c.searchQuery = '';
    c.searchResults = [];
    c.showSearchDropdown = false;
  };

  c.openEventModal = function(event) {
    if (event.source === 'content_portal') {
      c.selectedEvent = event;
      c.showEventModal = true;
    }
  };

  c.closeEventModal = function() {
    c.showEventModal = false;
    c.selectedEvent = null;
  };

  c.formatEventDate = function(dateStr) {
    if (!dateStr || dateStr.length < 8) return '';
    
    var year = dateStr.substring(0, 4);
    var month = dateStr.substring(4, 6);
    var day = dateStr.substring(6, 8);
    var hour = dateStr.length >= 10 ? dateStr.substring(8, 10) : '00';
    var minute = dateStr.length >= 12 ? dateStr.substring(10, 12) : '00';
    
    var date = new Date(year, month - 1, day, hour, minute);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  c.populateLocations = function() {
    var locationSet = new Set();
    c.events.forEach(function(event) {
      if (event.region && event.region.trim()) {
        locationSet.add(event.region.trim());
      }
    });
    c.availableLocations = Array.from(locationSet).sort();
  };

  c.populateLocations();

  c.events.forEach(function(e) {
    if (!e.event_date || e.event_date.length < 8) return;

    var eventKey = e.title + '|' + e.event_date + '|' + (e.event_end || '');
    if (processedEvents.has(eventKey)) return;
    processedEvents.add(eventKey);

    var startYyyy = e.event_date.substring(0, 4);
    var startMm = e.event_date.substring(4, 6);
    var startDd = e.event_date.substring(6, 8);
    var startKey = startYyyy + '-' + startMm + '-' + startDd;

    var startDateOnly = e.event_date.substring(0, 8);
    var endDateOnly = e.event_end ? e.event_end.substring(0, 8) : startDateOnly;

    if (!e.event_end || e.event_end.length < 8 || startDateOnly === endDateOnly) {
      if (!c.eventsByDate[startKey]) c.eventsByDate[startKey] = [];
      
      var isDuplicate = c.eventsByDate[startKey].some(function(existingEvent) {
        return existingEvent.title === e.title;
      });
      
      if (!isDuplicate) {
        c.eventsByDate[startKey].push(e);
      }
    } else {
      var endYyyy = e.event_end.substring(0, 4);
      var endMm = e.event_end.substring(4, 6);
      var endDd = e.event_end.substring(6, 8);
      
      var startDate = new Date(parseInt(startYyyy), parseInt(startMm) - 1, parseInt(startDd));
      var endDate = new Date(parseInt(endYyyy), parseInt(endMm) - 1, parseInt(endDd));
      
      var isDuplicateMultiDay = c.multiDayEvents.some(function(existingEvent) {
        return existingEvent.title === e.title && 
               existingEvent.startDate.getTime() === startDate.getTime() &&
               existingEvent.endDate.getTime() === endDate.getTime();
      });
      
      if (!isDuplicateMultiDay) {
        var multiDayEvent = {
          title: e.title,
          startDate: startDate,
          endDate: endDate,
          sys_id: e.sys_id,
          source: e.source,
          event_type: e.event_type,
          rich_text: e.rich_text,
          isMultiDay: true
        };
        c.multiDayEvents.push(multiDayEvent);
        
        var currentDate = new Date(startDate);
        while (currentDate <= endDate) {
          var dateKey = currentDate.toISOString().split('T')[0];
          if (!c.multiDayEventsByDate[dateKey]) c.multiDayEventsByDate[dateKey] = [];
          c.multiDayEventsByDate[dateKey].push(multiDayEvent);
          currentDate.setDate(currentDate.getDate() + 1);
        }
      }
    }
  });

  c.applyLocationFilter = function() {
    c.applyFilters();
  };

  c.applyEventTypeFilter = function() {
    c.applyFilters();
  };

  c.applyFilters = function() {
    if (c.currentDisplayMode === 'list') {
      c.prepareListView();
      return;
    }
    
    if (!c.monthOrWeekDays) return;
    
    c.monthOrWeekDays.forEach(function(day) {
      if (day && !day.outside && day.events) {
        day.filteredEvents = c.filterEvents(day.events);
      }
    });
    
    var filteredMultiDayEvents = c.filterEvents(c.multiDayEvents);
    c.recalculateMultiDayPositions(filteredMultiDayEvents);
  };

  c.filterEvents = function(events) {
    return events.filter(function(event) {
      var passesTypeFilter = true;
      var passesLocationFilter = true;
      
      if (c.selectedEventType) {
        switch (c.selectedEventType) {
          case 'holiday':
            passesTypeFilter = event.source === 'holiday';
            break;
          case 'game':
            passesTypeFilter = event.source === 'content_portal' && event.event_type === 'game';
            break;
          case 'office':
            passesTypeFilter = event.source === 'content_portal' && (!event.event_type || event.event_type === 'office');
            break;
          default:
            passesTypeFilter = true;
        }
      }
      
      if (c.selectedLocation && event.source === 'holiday') {
        passesLocationFilter = event.region === c.selectedLocation;
      }
      
      return passesTypeFilter && passesLocationFilter;
    });
  };

  c.recalculateMultiDayPositions = function(filteredMultiDayEvents) {
    if (!c.monthOrWeekDays || c.viewMode === 'year' || c.viewMode === 'nextYear') return;
    
    c.filteredSpanningEvents = [];
    var weeks = c.getWeeks(c.monthOrWeekDays);
    var daySlots = {};
    
    weeks.forEach(function(week, weekIndex) {
      var weekEvents = [];
      
      filteredMultiDayEvents.forEach(function(event) {
        var startCol = -1;
        var endCol = -1;
        
        week.forEach(function(day, dayIndex) {
          if (day.date >= event.startDate && day.date <= event.endDate && !day.outside) {
            if (startCol === -1) {
              startCol = dayIndex;
            }
            endCol = dayIndex;
          }
        });
        
        if (startCol !== -1) {
          weekEvents.push({
            event: event,
            startCol: startCol,
            endCol: endCol,
            weekIndex: weekIndex
          });
        }
      });
      
      weekEvents.sort(function(a, b) {
        if (a.startCol !== b.startCol) return a.startCol - b.startCol;
        return (b.endCol - b.startCol) - (a.endCol - a.startCol);
      });
      
      weekEvents.forEach(function(weekEvent) {
        var slot = -1;
        var placed = false;
        
        for (var s = 0; s < 3 && !placed; s++) {
          var canPlace = true;
          
          for (var col = weekEvent.startCol; col <= weekEvent.endCol; col++) {
            var dayIndex = weekIndex * 7 + col;
            var day = c.monthOrWeekDays[dayIndex];
            if (!day || day.outside) continue;
            
            var dayKey = day.date.toISOString().split('T')[0];
            if (!daySlots[dayKey]) daySlots[dayKey] = { occupied: [], singleDayCount: 0 };
            
            if (daySlots[dayKey].occupied[s]) {
              canPlace = false;
              break;
            }
            
            var totalEventsForDay = daySlots[dayKey].occupied.filter(Boolean).length + (day.filteredEvents ? day.filteredEvents.length : 0);
            if (totalEventsForDay >= 3) {
              canPlace = false;
              break;
            }
          }
          
          if (canPlace) {
            for (var col = weekEvent.startCol; col <= weekEvent.endCol; col++) {
              var dayIndex = weekIndex * 7 + col;
              var day = c.monthOrWeekDays[dayIndex];
              if (!day || day.outside) continue;
              
              var dayKey = day.date.toISOString().split('T')[0];
              if (!daySlots[dayKey]) daySlots[dayKey] = { occupied: [], singleDayCount: 0 };
              daySlots[dayKey].occupied[s] = true;
            }
            
            slot = s;
            placed = true;
          }
        }
        
        if (placed) {
          var isLastOccurrence = true;
          
          for (var laterWeek = weekEvent.weekIndex + 1; laterWeek < weeks.length; laterWeek++) {
            var laterWeekDays = weeks[laterWeek];
            
            for (var dayIdx = 0; dayIdx < laterWeekDays.length; dayIdx++) {
              var laterDay = laterWeekDays[dayIdx];
              if (!laterDay.outside && laterDay.date >= weekEvent.event.startDate && laterDay.date <= weekEvent.event.endDate) {
                isLastOccurrence = false;
                break;
              }
            }
            
            if (!isLastOccurrence) break;
          }
          
          c.filteredSpanningEvents.push({
            event: weekEvent.event,
            weekIndex: weekEvent.weekIndex,
            startCol: weekEvent.startCol,
            endCol: weekEvent.endCol,
            slot: slot,
            showTitle: isLastOccurrence
          });
        }
      });
    });
    
    c.monthOrWeekDays.forEach(function(day) {
      if (day && !day.outside) {
        var dayKey = day.date.toISOString().split('T')[0];
        var slots = daySlots[dayKey];
        if (slots) {
          day.occupiedSlots = slots.occupied.filter(Boolean).length;
          day.availableSlots = 3 - day.occupiedSlots;
        } else {
          day.occupiedSlots = 0;
          day.availableSlots = 3;
        }
      }
    });
  };

  function buildCalendar(view, date) {
    var y = date.getFullYear(), m = date.getMonth();
    var days = [], key;

    if (view === 'month') {
      var first = new Date(y, m, 1);
      var total = new Date(y, m + 1, 0).getDate();
      var offset = first.getDay();
      var padEnd = (7 - ((offset + total) % 7)) % 7;

      for (var p = offset - 1; p >= 0; p--) {
        var prev = new Date(y, m, -p);
        days.push({ date: prev, day: prev.getDate(), outside: true });
      }
      for (var i = 1; i <= total; i++) {
        var cur = new Date(y, m, i);
        key = cur.toISOString().split('T')[0];
        var dayEvents = c.eventsByDate[key] || [];
        var dayMultiDayEvents = c.multiDayEventsByDate[key] || [];
        days.push({ 
          date: cur, 
          day: i, 
          outside: false, 
          events: dayEvents,
          filteredEvents: c.filterEvents(dayEvents),
          multiDayCount: dayMultiDayEvents.length
        });
      }
      for (var n = 1; n <= padEnd; n++) {
        var nxt = new Date(y, m + 1, n);
        days.push({ date: nxt, day: nxt.getDate(), outside: true });
      }
      c.monthOrWeekDays = days;

    } else if (view === 'week') {
      var sun = new Date(date);
      sun.setDate(sun.getDate() - sun.getDay());
      for (var j = 0; j < 7; j++) {
        var wd = new Date(sun);
        wd.setDate(sun.getDate() + j);
        key = wd.toISOString().split('T')[0];
        var dayEvents = c.eventsByDate[key] || [];
        var dayMultiDayEvents = c.multiDayEventsByDate[key] || [];
        days.push({ 
          date: wd, 
          day: wd.getDate(), 
          outside: false, 
          events: dayEvents,
          filteredEvents: c.filterEvents(dayEvents),
          multiDayCount: dayMultiDayEvents.length
        });
      }
      c.monthOrWeekDays = days;

    } else {
      var yr = view === 'nextYear' ? y + 1 : y;
      var months = [];
      for (var k = 0; k < 12; k++) {
        months.push({
          label: new Date(yr, k).toLocaleString('default', { month: 'long' }),
          month: k,
          year: yr
        });
      }
      c.yearMonths = months;
    }

    c.calculateMultiDayPositions();
    c.applyFilters();
  }

  c.calculateMultiDayPositions = function() {
    if (!c.monthOrWeekDays || c.viewMode === 'year' || c.viewMode === 'nextYear') return;
    
    c.spanningEvents = [];
    var weeks = c.getWeeks(c.monthOrWeekDays);
    
    var daySlots = {};
    
    weeks.forEach(function(week, weekIndex) {
      var weekEvents = [];
      
      c.multiDayEvents.forEach(function(event) {
        var startCol = -1;
        var endCol = -1;
        
        week.forEach(function(day, dayIndex) {
          if (day.date >= event.startDate && day.date <= event.endDate && !day.outside) {
            if (startCol === -1) {
              startCol = dayIndex;
            }
            endCol = dayIndex;
          }
        });
        
        if (startCol !== -1) {
          weekEvents.push({
            event: event,
            startCol: startCol,
            endCol: endCol,
            weekIndex: weekIndex
          });
        }
      });
      
      weekEvents.sort(function(a, b) {
        if (a.startCol !== b.startCol) return a.startCol - b.startCol;
        return (b.endCol - b.startCol) - (a.endCol - a.startCol);
      });
      
      weekEvents.forEach(function(weekEvent) {
        var slot = -1;
        var placed = false;
        
        for (var s = 0; s < 3 && !placed; s++) {
          var canPlace = true;
          
          for (var col = weekEvent.startCol; col <= weekEvent.endCol; col++) {
            var dayIndex = weekIndex * 7 + col;
            var day = c.monthOrWeekDays[dayIndex];
            if (!day || day.outside) continue;
            
            var dayKey = day.date.toISOString().split('T')[0];
            if (!daySlots[dayKey]) daySlots[dayKey] = { occupied: [], singleDayCount: 0 };
            
            if (daySlots[dayKey].occupied[s]) {
              canPlace = false;
              break;
            }
            
            var totalEventsForDay = daySlots[dayKey].occupied.filter(Boolean).length + (day.events ? day.events.length : 0);
            if (totalEventsForDay >= 3) {
              canPlace = false;
              break;
            }
          }
          
          if (canPlace) {
            for (var col = weekEvent.startCol; col <= weekEvent.endCol; col++) {
              var dayIndex = weekIndex * 7 + col;
              var day = c.monthOrWeekDays[dayIndex];
              if (!day || day.outside) continue;
              
              var dayKey = day.date.toISOString().split('T')[0];
              if (!daySlots[dayKey]) daySlots[dayKey] = { occupied: [], singleDayCount: 0 };
              daySlots[dayKey].occupied[s] = true;
            }
            
            slot = s;
            placed = true;
          }
        }
        
        if (placed) {
          var isLastOccurrence = true;
          var eventEndDate = weekEvent.event.endDate;
          
          for (var laterWeek = weekEvent.weekIndex + 1; laterWeek < weeks.length; laterWeek++) {
            var laterWeekDays = weeks[laterWeek];
            
            for (var dayIdx = 0; dayIdx < laterWeekDays.length; dayIdx++) {
              var laterDay = laterWeekDays[dayIdx];
              if (!laterDay.outside && laterDay.date >= weekEvent.event.startDate && laterDay.date <= weekEvent.event.endDate) {
                isLastOccurrence = false;
                break;
              }
            }
            
            if (!isLastOccurrence) break;
          }
          
          c.spanningEvents.push({
            event: weekEvent.event,
            weekIndex: weekEvent.weekIndex,
            startCol: weekEvent.startCol,
            endCol: weekEvent.endCol,
            slot: slot,
            showTitle: isLastOccurrence
          });
        }
      });
    });
    
    c.filteredSpanningEvents = c.spanningEvents;
    
    c.monthOrWeekDays.forEach(function(day) {
      if (day && !day.outside) {
        var dayKey = day.date.toISOString().split('T')[0];
        var slots = daySlots[dayKey];
        if (slots) {
          day.occupiedSlots = slots.occupied.filter(Boolean).length;
          day.availableSlots = 3 - day.occupiedSlots;
        } else {
          day.occupiedSlots = 0;
          day.availableSlots = 3;
        }
      }
    });
  };

  c.getWeeks = function(arr) {
    var out = [];
    for (var i = 0; i < arr.length; i += 7) out.push(arr.slice(i, i + 7));
    return out;
  };

  c.setView = function(v) {
    c.viewMode = null;
    c.monthOrWeekDays = null;
    c.yearMonths = null;
    c.spanningEvents = [];
    c.filteredSpanningEvents = [];

    setTimeout(function() {
      $scope.$applyAsync(function() {
        c.viewMode = v;

        if (v === 'week' || v === 'month') {
          c.monthOrWeekDays = [];
          c.yearMonths = null;
        } else {
          c.yearMonths = [];
          c.monthOrWeekDays = null;
        }

        c.baseDate = new Date();
        if (v === 'nextYear') {
          c.baseDate.setFullYear(c.baseDate.getFullYear() + 1);
        }

        buildCalendar(v, c.baseDate);
      });
    }, 0);
  };

  c.openMonthFromYear = function(month, year) {
    c.viewMode = null;
    c.monthOrWeekDays = null;
    c.yearMonths = null;
    c.spanningEvents = [];
    c.filteredSpanningEvents = [];

    setTimeout(function() {
      $scope.$applyAsync(function() {
        c.baseDate = new Date(year, month, 1);
        c.viewMode = 'month';
        c.monthOrWeekDays = [];
        c.yearMonths = null;
        buildCalendar('month', c.baseDate);
      });
    }, 0);
  };

  c.next = function() {
    if (c.viewMode === 'month') c.baseDate.setMonth(c.baseDate.getMonth() + 1);
    else if (c.viewMode === 'week') c.baseDate.setDate(c.baseDate.getDate() + 7);
    else c.baseDate.setFullYear(c.baseDate.getFullYear() + 1);
    buildCalendar(c.viewMode, c.baseDate);
  };

  c.previous = function() {
    if (c.viewMode === 'month') c.baseDate.setMonth(c.baseDate.getMonth() - 1);
    else if (c.viewMode === 'week') c.baseDate.setDate(c.baseDate.getDate() - 7);
    else c.baseDate.setFullYear(c.baseDate.getFullYear() - 1);
    buildCalendar(c.viewMode, c.baseDate);
  };

  $scope.$evalAsync(function() {
    c.setView('month');
  });
}
