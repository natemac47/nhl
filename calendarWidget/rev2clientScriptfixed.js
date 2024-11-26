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
            // Apply region filter if a saved region exists
            $scope.initRegionSelection();

            if (callback) callback();
        });
    };

    $scope.filterByRegion = function(regionSysId) {
        localStorage.setItem('selectedRegion', regionSysId);

        if (!regionSysId) {
            // Combine and sort all holidays from all regions
            $scope.data.thisYearItems = angular.copy($scope.originalThisYearItems).sort((a, b) => a.numeric - b.numeric);
            $scope.data.nextYearItems = angular.copy($scope.originalNextYearItems).sort((a, b) => a.numeric - b.numeric);

            // Merge both years into a single array for chronological display
            $scope.data.allYearItems = [...$scope.data.thisYearItems, ...$scope.data.nextYearItems].sort((a, b) => a.numeric - b.numeric);
            return;
        }

        const selectedRegionObj = $scope.data.regions.find(r => r.sys_id === regionSysId);
        if (!selectedRegionObj) {
            console.warn("Region not found:", regionSysId);
            return;
        }

        const selectedRegionNameNormalized = selectedRegionObj.normalized_region;

        $scope.data.thisYearItems = $scope.originalThisYearItems.filter(event => {
            return event.region.trim().toLowerCase() === selectedRegionNameNormalized;
        }).sort((a, b) => a.numeric - b.numeric);

        $scope.data.nextYearItems = $scope.originalNextYearItems.filter(event => {
            return event.region.trim().toLowerCase() === selectedRegionNameNormalized;
        }).sort((a, b) => a.numeric - b.numeric);

        // Merge filtered results into a single array
        $scope.data.allYearItems = [...$scope.data.thisYearItems, ...$scope.data.nextYearItems].sort((a, b) => a.numeric - b.numeric);
    };

    $scope.initRegionSelection = function() {
        const savedRegion = localStorage.getItem('selectedRegion');
        if (savedRegion) {
            $scope.selectedRegion = savedRegion;
            $scope.filterByRegion(savedRegion);
        }
    };

    $scope.handleKeyBoardEvent = function(event) {
        if (event.keyCode === 32 || event.keyCode === 13) {
            event.preventDefault();
            $timeout(function() {
                event.target.click();
            }, 0);
        }
    };

    $scope.loadData();
}
