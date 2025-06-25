api.controller = function($scope, $location, $window) {
    var c = this;
    $scope.sortAll = {};
    $scope.sortMember = {};
    $scope.sortReportee = {};
    $scope.isTeamLoaded = false;
    var symbol_OR = "^";
    var default_query = 'active=true^nameISNOTEMPTY^emailISNOTEMPTY';
    c.selectedDepartmentSys_id = '';
    c.selectedLocationSys_id = '';

    c.depFilter = c.data.departments[0];
    c.locFilter = c.data.locations[0];
    c.notaryFilter = false;
    c.firstAidFilter = false;

    $scope.openProfile = function(user) {
        $window.open("/" + c.data.portal_suffix + "?id=hri_user_profile&sys_id=" + user.sys_id, "_blank");
    };

    $scope.ifShowMore = false;

    if (c.data.usersInfo.length < c.data.totalCount) {
        $scope.ifShowMore = true;
    }

    c.addLocationDepartmentfilter = function() {
        _clearEmployeeSelect();
        c.filterUserRecords();
    };
    c.addLocDeptFilterForEmpSearch = "";
    c.filterUserRecords = function() {
        c.selectedDepartmentValue = c.depFilter.sys_id;
        c.selectedLocationValue = c.locFilter.sys_id;

        var filterCondition = buildUserFilterCondition(c.selectedDepartmentValue, c.selectedLocationValue, c.selectedEmployeeValue || "", c.notaryFilter, c.firstAidFilter);
        c.addLocDeptFilterForEmpSearch = symbol_OR + filterCondition;
        c.server.get({
            'action': 'filterUserRecords',
            'filter': filterCondition,
            'notaryFilter': c.notaryFilter,
            'firstAidFilter': c.firstAidFilter
        }).then(function(r) {
            c.data.usersInfo = r.data.usersInfo;
            c.data.employees = r.data.employees;

            if (c.data.usersInfo.length < c.data.totalCount) {
                $scope.ifShowMore = true;
            } else {
                $scope.ifShowMore = false;
            }
        });

    };

    $scope.$on("field.change", function(evt, parms) {
        c.addLocDeptFilterForEmpSearch = default_query + symbol_OR;
        c.selectedEmployeeValue = parms.newValue;
        c.filterUserRecords();
    });

    function _clearEmployeeSelect() {
        $('#employee-select').select2("val", "");
        c.selectedEmployeeValue = "";
    }

    c.loadMore = function() {
        $scope.loc = c.data.locations;
        $scope.depart = c.data.departments;
        var order = '';

        var filterCondition = buildUserFilterCondition(c.selectedDepartmentValue, c.selectedLocationValue, c.selectedEmployeeValue, c.notaryFilter, c.firstAidFilter);
        c.addLocDeptFilterForEmpSearch = symbol_OR + filterCondition;
        if ($scope.sortAll[$scope.sortSetTo]) {
            order = 'desc';
        }
        c.server.get({
            'action': 'showMore',
            'newLimit': c.data.usersInfo.length,
            'filter': filterCondition,
            'sortBy': $scope.sortSetTo,
            'order': order,
            'notaryFilter': c.notaryFilter,
            'firstAidFilter': c.firstAidFilter
        }).then(function(r) {
            if (r.data.usersInfo.length < r.data.totalCount) {
                $scope.ifShowMore = true;
            } else {
                $scope.ifShowMore = false;
            }
            c.data.usersInfo = r.data.usersInfo;
            c.data.departments = $scope.depart;
            c.data.locations = $scope.loc;
        });
    };

    $scope.sortTMData = function(sortBy) {
        var orderNum = 1;
        var s_val = !$scope.sortMember[sortBy];
        for (var key in $scope.sortMember) {
            if (key != sortBy) {
                $scope.sortMember[key] = false;
            }
        }
        $scope.sortMember[sortBy] = s_val;
        if ($scope.sortMember[sortBy]) {
            orderNum = -1;
        }
        $scope.teamMembers.sort(function(a, b) {
            var x = a[sortBy].toLowerCase();
            var y = b[sortBy].toLowerCase();
            if (x < y) {
                return -1 * orderNum;
            }
            if (x > y) {
                return 1 * orderNum;
            }
            return 0;
        });
    };

    $scope.sortDRData = function(sortBy) {
        var orderNum = 1;
        var s_val = !$scope.sortReportee[sortBy];
        for (var key in $scope.sortReportee) {
            if (key != sortBy) {
                $scope.sortReportee[key] = false;
            }
        }
        $scope.sortReportee[sortBy] = s_val;
        if ($scope.sortReportee[sortBy]) {
            orderNum = -1;
        }
        $scope.directReports.sort(function(a, b) {
            var x = a[sortBy].toLowerCase();
            var y = b[sortBy].toLowerCase();
            if (x < y) {
                return -1 * orderNum;
            }
            if (x > y) {
                return 1 * orderNum;
            }
            return 0;
        });
    };

    $scope.sortAllData = function(sortBy) {
        $scope.sortSetTo = sortBy;

        var filterCondition = buildUserFilterCondition(c.selectedDepartmentValue, c.selectedLocationValue, c.selectedEmployeeValue, c.notaryFilter, c.firstAidFilter);
        c.addLocDeptFilterForEmpSearch = symbol_OR + filterCondition;
        var order = '';
        var orderNum = 1;
        var s_val = !$scope.sortAll[sortBy];
        for (var key in $scope.sortAll) {
            if (key != sortBy) {
                $scope.sortAll[key] = false;
            }
        }
        $scope.sortAll[sortBy] = s_val;
        if (c.selectedDepartmentSys_id) {
            filter = "department=" + c.selectedDepartmentSys_id;
        }
        if ($scope.sortAll[sortBy]) {
            order = 'desc';
            orderNum = -1;
        }
        if (c.data.usersInfo.length <= c.data.items_per_page) {
            c.data.usersInfo.sort(function(a, b) {
                var x = a[sortBy].toLowerCase();
                var y = b[sortBy].toLowerCase();
                if (x < y) {
                    return -1 * orderNum;
                }
                if (x > y) {
                    return 1 * orderNum;
                }
                return 0;
            });
        } else {
            c.server.get({
                'action': 'sortData',
                'filter': filterCondition,
                'newLimit': c.data.usersInfo.length,
                'sortBy': sortBy,
                'order': order,
                'notaryFilter': c.notaryFilter,
                'firstAidFilter': c.firstAidFilter
            }).then(function(r) {
                c.data.usersInfo = r.data.usersInfo;
            });
        }
    };

    $scope.getMyTeam = function() {
        if (!$scope.isTeamLoaded) {
            c.server.get({
                'action': 'getTeamData'
            }).then(function(r) {
                $scope.myManager = r.data.teamData.manager;
                $scope.myManagerModel = Object.keys($scope.myManager).length === 0 ? [] : [$scope.myManager];
                $scope.teamMembers = r.data.teamData.members;
                $scope.directReports = r.data.teamData.direct_reports;
                $scope.isTeamLoaded = true;
            });
        }
    };

    buildUserFilterCondition = function(departmentId, locationId, empSysId, notaryFilter, firstAidFilter) {

        var filterCondition = '';
        if (departmentId) {
            filterCondition = "department=" + c.selectedDepartmentValue;
        }

        if (locationId) {
            if (filterCondition) {
                filterCondition = filterCondition + "^location=" + c.selectedLocationValue;

            } else {
                filterCondition = "location=" + c.selectedLocationValue;
            }

        }

        if (empSysId) {
            if (filterCondition) {
                filterCondition = filterCondition + "^sys_id=" + c.selectedEmployeeValue;

            } else {
                filterCondition = "sys_id=" + c.selectedEmployeeValue;
            }
        }
        return filterCondition;
    };
};
