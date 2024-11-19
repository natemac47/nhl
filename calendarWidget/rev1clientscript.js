function cdCalendarController($scope, $timeout, cdAnalytics) {
    var c = this;
    $scope.cdAnalytics = cdAnalytics;
    c.showSelection = false;
    $scope.selectedCalendar = 0;
    $scope.selectedYear = 0;
    $scope.selectedRegion = null; 
    $scope.isFirstLoad = true;
    $scope.trackedImpressions = {};

    $scope.originalThisYearItems = [];
    $scope.originalNextYearItems = [];

    $scope.loadData = function(callback) {
        $scope.data.action = "loadData";
        $scope.server.update().then(function() {
            if ($scope.isFirstLoad) {
                $scope.originalThisYearItems = angular.copy($scope.data.thisYearItems);
                $scope.originalNextYearItems = angular.copy($scope.data.nextYearItems);
                $scope.isFirstLoad = false;
            }
            if (callback) callback();
        });
    };

    function sortItems() {
        if (!$scope.data.thisYearItems) $scope.data.thisYearItems = [];
        if (!$scope.data.nextYearItems) $scope.data.nextYearItems = [];

        sort($scope.data.thisYearItems, 'numeric');
        sort($scope.data.nextYearItems, 'numeric');

        if ($scope.isFirstLoad) {
            if ($scope.data.allCalendars && $scope.data.allCalendars.length > 0)
                $scope.data.calendar = $scope.data.allCalendars[0];
        }
    }

    if (c.data.async)
        $scope.loadData(sortItems);
    else
        sortItems();

$scope.filterByRegion = function(regionSysId) {
    const selectedRegionObj = $scope.data.regions.find(r => r.sys_id === regionSysId);
    if (!selectedRegionObj) {
        console.warn("Region not found:", regionSysId);
        return;
    }

    const selectedRegionNameNormalized = selectedRegionObj.normalized_region;

    const filteredThisYearItems = $scope.originalThisYearItems.filter(event => {
        return event.region.trim().toLowerCase() === selectedRegionNameNormalized;
    });

    const filteredNextYearItems = $scope.originalNextYearItems.filter(event => {
        return event.region.trim().toLowerCase() === selectedRegionNameNormalized;
    });

    $scope.data.thisYearItems = filteredThisYearItems;
    $scope.data.nextYearItems = filteredNextYearItems;

    if (filteredThisYearItems.length === 0 && filteredNextYearItems.length === 0) {
        console.warn("No matching events found for region:", selectedRegionNameNormalized);
    }
};



    $scope.handleKeyBoardEvent = function(event) {
        if (event.keyCode === 32 || event.keyCode == 13) {
            event.preventDefault();
            $timeout(function() {
                event.target.click();
            }, 0);
        }
    };

    function sort(array, key) {
        array.sort(function(a, b) {
            return a[key] - b[key];
        });
    }
}
