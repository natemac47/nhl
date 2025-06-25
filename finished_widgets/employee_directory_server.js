(function() {
    data.sysUserID = $sp.getParameter("sys_id") || gs.getUserID();

    data.can_show_other_user_information = gs.getProperty("sn_ec_packs.can_end_users_view_user_info", false);

    data.items_per_page = options.items_per_page ? parseInt(options.items_per_page) : 10;

    var portalGr = $sp.getPortalRecord();
    data.portal_suffix = portalGr.getValue('url_suffix');

    data.org_page_exists = checkIfPageExists("my_org_chart");

    if (data.org_page_exists) {
        data.org_link = "/" + data.portal_suffix + "?id=my_org_chart&p=";
    }

    data.loc_dir_page_exists = checkIfPageExists("location_directory");

    if (data.loc_dir_page_exists) {
        data.loc_dir_link = "/" + data.portal_suffix + "?id=location_directory&location_sys_id=";
    }

    var currentUserGr = new GlideRecordSecure("sys_user");
    data.userExists = currentUserGr.get(data.sysUserID);
    data.departments = [{
        "name": gs.getMessage("All Departments"),
        "sys_id": ""
    }];
    data.locations = [{
        "name": gs.getMessage("All Locations"),
        "sys_id": ""
    }];

    if (input && input.action == 'filterUserRecords') {
        getPeopleData(input.filter, "", "", "", "", input.notaryFilter, input.firstAidFilter);
    } else if (input && input.action == 'getTeamData') {
        getTeamData();
    } else if (input && input.action == 'sortData') {
        if (input.filter) {
            getPeopleData(input.filter, "", "", input.sortBy, input.order, input.notaryFilter, input.firstAidFilter);
        } else {
            getPeopleData("", "", "", input.sortBy, input.order, input.notaryFilter, input.firstAidFilter);
        }
    } else if (input && input.action == 'showMore') {
        getPeopleData(input.filter, 'showMore', input.newLimit, input.sortBy, input.order, input.notaryFilter, input.firstAidFilter);
    } else {
        getPeopleData();
        loadDepartments();
        loadLocations();
    }

    function getTeamData() {
        data.directReports = [];
        data.teamData = {};
        data.teamData.direct_reports = [];
        data.teamData.members = [];
        data.teamData.manager = {};
        
        if (currentUserGr.getValue("manager")) {
            var managerGR = data.can_show_other_user_information == 'true' ? new GlideRecord("sys_user") : new GlideRecordSecure("sys_user");
            if (managerGR.get(currentUserGr.getValue("manager"))) {
                data.teamData.manager = buildUser(managerGR);
            }

            var teamGR = data.can_show_other_user_information == 'true' ? new GlideRecord("sys_user") : new GlideRecordSecure("sys_user");
            teamGR.addActiveQuery();
            teamGR.orderBy('name');
            teamGR.addQuery("manager", data.teamData.manager.sys_id);
            teamGR.addQuery("sys_id", '!=', data.sysUserID);
            teamGR.query();
            while (teamGR.next()) {
                data.teamData.members.push(buildUser(teamGR));
            }
        }

        var directReportGR = data.can_show_other_user_information == 'true' ? new GlideRecord("sys_user") : new GlideRecordSecure("sys_user");
        directReportGR.addActiveQuery();
        directReportGR.orderBy('name');
        directReportGR.addEncodedQuery("manager.sys_idSTARTSWITH" + data.sysUserID, true);
        directReportGR.query();
        while (directReportGR.next()) {
            data.teamData.direct_reports.push(buildUser(directReportGR));
        }
    }

    function loadDepartments() {
        var grDept = new GlideAggregate('sys_user');
        grDept.addEncodedQuery('active=true', true);
        grDept.addAggregate('count');
        grDept.orderByAggregate('count');
        grDept.groupBy('department');
        grDept.query();
        while (grDept.next()) {
            var department = {};
            department.name = grDept.getDisplayValue("department");
            department.sys_id = grDept.getValue("department");
            if (department.name) {
                data.departments.push(department);
            }
        }
    }

    function loadLocations(filter) {
        var queryStringLoc = "active=true";
        if (filter) {
            queryStringLoc = "active=true^" + filter;
        }
        var userGR = new GlideAggregate('sys_user');
        userGR.addEncodedQuery(queryStringLoc,true);
        userGR.addAggregate('count');
        userGR.orderByAggregate('count');
        userGR.groupBy('location');
        userGR.query();
        while (userGR.next()) {
            var location = {};
            location.name = userGR.getDisplayValue("location");
            location.sys_id = userGR.getValue("location");
            if (location.name) {
                data.locations.push(location);
            }
        }
    }

function getPeopleData(filter, showMore, newLimit, sortBy, order, notaryFilter, firstAidFilter) {
    var userGR = data.can_show_other_user_information == 'true' ? new GlideRecord("sys_user") : new GlideRecordSecure("sys_user");
    data.usersInfo = [];
    var queryString = "active=true^nameISNOTEMPTY^emailISNOTEMPTY";

    if (!newLimit) {
        data.limit = data.items_per_page;
    }
    if (showMore && showMore == 'showMore') {
        data.limit = newLimit + data.items_per_page;
    }
    if (filter) {
        queryString = queryString + "^" + filter;
    }

    notaryFilter = (notaryFilter === true || notaryFilter === "true");
    firstAidFilter = (firstAidFilter === true || firstAidFilter === "true");

    var userSysIds = [];
    if (notaryFilter || firstAidFilter) {
        var tempUserGR = new GlideRecord("sys_user");
        tempUserGR.addEncodedQuery(queryString);
        tempUserGR.query();
        
        var baseUserIds = [];
        while (tempUserGR.next()) {
            baseUserIds.push(tempUserGR.getValue("sys_id"));
        }
        
        if (baseUserIds.length > 0) {
            var hrQuery = new GlideRecord("sn_hr_core_profile");
            hrQuery.addQuery("user", "IN", baseUserIds.join(','));
            
            if (notaryFilter && firstAidFilter) {
                hrQuery.addQuery("u_notary", true);
                hrQuery.addQuery("u_is_first_aid_trained", true);
            } else if (notaryFilter) {
                hrQuery.addQuery("u_notary", true);
            } else if (firstAidFilter) {
                hrQuery.addQuery("u_is_first_aid_trained", true);
            }
            
            hrQuery.query();
            while (hrQuery.next()) {
                userSysIds.push(hrQuery.getValue("user"));
            }
            
            if (userSysIds.length > 0) {
                queryString = queryString + "^sys_idIN" + userSysIds.join(',');
            } else {
                queryString = queryString + "^sys_id=0"; 
            }
        } else {
            queryString = queryString + "^sys_id=0"; 
        }
    }

    data.totalCount = getTotalUserRecordsCount(queryString);
    var orderBy = 'name';
    if (sortBy) {
        orderBy = sortBy;
    }
    if (order == 'desc') {
        userGR.orderByDesc(orderBy);
    } else {
        userGR.orderBy(orderBy);
    }
    userGR.addEncodedQuery(queryString, true);
    userGR.setLimit(data.limit);
    userGR.query();
    
    while (userGR.next()) {
        var userDetail = {
            sys_id: userGR.getValue("sys_id"),
            name: userGR.getValue("name"),
            email: userGR.getValue("email") || "",
            title: userGR.getValue("title"),
            department: userGR.getDisplayValue("department") || "",
            phone: userGR.getValue("phone") || "",
            location: userGR.getDisplayValue("location"),
            location_id: userGR.getValue("location"),
            u_office_location: userGR.getDisplayValue("u_office_location") || ""
        };
        
        var hrData = getHRProfileData(userGR.getValue("sys_id"));
        userDetail.u_notary = hrData.u_notary;
        userDetail.u_is_first_aid_trained = hrData.u_is_first_aid_trained;
        
        data.usersInfo.push(userDetail);
    }
}

    function buildUser(userGr) {
        var user = {
            sys_id: userGr.getValue("sys_id"),
            name: userGr.getValue("name"),
            email: userGr.getValue("email") || "",
            title: userGr.getValue("title"),
            department: userGr.getDisplayValue("department") || "",
            phone: userGr.getValue("phone") || "",
            location: userGr.getDisplayValue("location"),
            location_id: userGr.getValue("location"),
            u_office_location: userGr.getDisplayValue("u_office_location") || ""
        };
        
        var hrData = getHRProfileData(userGr.getValue("sys_id"));
        user.u_notary = hrData.u_notary;
        user.u_is_first_aid_trained = hrData.u_is_first_aid_trained;
        
        return user;
    }

    function getHRProfileData(userSysId) {
        var hrData = {
            u_notary: "",
            u_is_first_aid_trained: ""
        };
        
        var hrGR = new GlideRecord("sn_hr_core_profile");
        hrGR.addQuery("user", userSysId);
        hrGR.query();
        
        if (hrGR.next()) {
            hrData.u_notary = hrGR.getDisplayValue("u_notary") || "";
            hrData.u_is_first_aid_trained = hrGR.getDisplayValue("u_is_first_aid_trained") || "";
        }
        
        return hrData;
    }

    function checkIfPageExists(page_id) {
        var pageGr = new GlideRecord("sp_page");
        pageGr.addQuery('id', page_id);
        pageGr.query();
        if (pageGr.next()) {
            return true;
        }
        return false;
    }

    function getTotalUserRecordsCount(encodedQuery) {
        var userGa = new GlideAggregate('sys_user');
        userGa.addEncodedQuery(encodedQuery, true);
        userGa.addAggregate('COUNT');
        userGa.query();
        var usersCount = 0;
        if (userGa.next())
            usersCount = userGa.getAggregate('COUNT');
        return usersCount;
    }
})();
