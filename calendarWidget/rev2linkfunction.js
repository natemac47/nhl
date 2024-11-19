function eventCalendarLink (scope, elem, attr) {
	elem.keydown(function (e) {
		var target = $(e.target);
		if ((target.is('li') && target.parent().is('.controller')) || (target.is('a') && target.parent().is('.popup-body')))
		{
			var $focused = $(document.activeElement);
			switch (e.keyCode) {
				case 27:
					document.getElementById('anchor').click();
					document.getElementById("anchor").focus();
					break;
				case 35:
					$focused.parent().find(':last-child').focus();
					e.preventDefault();
					break;
				case 36:
					$focused.parent().find(':first-child').focus();
					e.preventDefault();
					break;
				case 37:
				case 38:
					if ($focused.prev().length)
						$focused.prev().focus();
					else
						$focused.parent().find(':last-child').focus();
					e.preventDefault();
					break;
				case 39:
				case 40:
					if ($focused.next().length)
						$focused.next().focus();
					else
						$focused.parent().find(':first-child').focus();
					e.preventDefault();
					break;
				case 13:
					// For IE
					if ($focused && !!document.documentMode && !/a/i.test($focused[0].tagName))
						$focused.click();
					break;
				case 9:
					if(target.is('a') && target.parent().is('.popup-body'))
						document.getElementById('anchor').click();
					break;
			}
		}
	});

scope.showTabContent = function ($event, $index) {
    $event.preventDefault();
    scope.activeTab = scope.data[$index === 0 ? 'thisYear' : 'nextYear']; // Set the active tab to the correct year.
    scope.selectedYear = $index;
};


	scope.downloadEventSchedule = function () {
		if (!scope.data.isContentPreview)
			scope.cdAnalytics.trackEvent('Calendar Download', scope.data.calendar);

		var calendarId = scope.data.calSysId;
		var year = scope.activeTab || scope.data.thisYear;

		var eventDownloadRequest = new XMLHttpRequest();
		var processorUrl = "/sn_cd_downloadICS.do?sysparm_type=holiday&sysparm_year=" + year + "&sysparm_calendar=" + calendarId;
		eventDownloadRequest.open("POST", processorUrl, true);
		eventDownloadRequest.setRequestHeader("Content-type", "application/json");
		eventDownloadRequest.setRequestHeader("X-userToken", window.g_ck);
		eventDownloadRequest.responseType = "blob";
		eventDownloadRequest.onload = function(event) {
			var disposition = event.currentTarget.getResponseHeader('Content-Disposition');
			var fileName = disposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/)[1];
			var fileElement = document.createElement("a");
			fileElement.href = window.URL.createObjectURL(event.currentTarget.response);
			fileElement.download = fileName;
			fileElement.click();
			fileElement.remove();
		};

		eventDownloadRequest.send();
	};
}
