define(['ojs/ojcore',"knockout","jquery","appController", "ojs/ojarraydataprovider",
    "ojs/ojinputtext", "ojs/ojformlayout", "ojs/ojvalidationgroup", "ojs/ojselectsingle", "ojs/ojactioncard", "ojs/ojtable", "ojs/ojmenu", "ojs/ojchart"], 
    function (oj,ko,$, app, ArrayDataProvider) {

        class franchiseDashboard {
            constructor(args) {
                var self = this;

                let BaseURL = sessionStorage.getItem("BaseURL")
                self.userId = ko.observable(sessionStorage.getItem("userId"));
                self.router = args.parentRouter;                

                self.years = ko.observable();
                const currentYear = new Date().getFullYear();
                self.selectYear = ko.observable(currentYear.toString());

                if(sessionStorage.getItem("selectYear")==null || self.selectYear()==currentYear){
                    sessionStorage.setItem("selectYear", self.selectYear())
                }

                const years = [];
                for (let year = currentYear; year >= 2022; year--) {
                    years.push({ value: `${year}`, label: `${year}`})
                }
                self.years(years);
                self.yearsDp = new ArrayDataProvider(self.years(), {
                    keyAttributes: 'value'
                });

                self.cardAction = (event) => {
                    let cardId = event.currentTarget.id;
                    
                    if(cardId==1){
                        self.router.go({path : 'franchiseStudents'});
                    }
                    else if(cardId==2){
                        self.router.go({path : 'franchiseApplication'});
                    }
                    else{
                        self.router.go({path : 'franchiseFinalchoiced'});
                    }
                };

                self.userOfficeId = ko.observable();
                self.userRole = ko.observable(sessionStorage.getItem("userRole"));
                self.userId = ko.observable();
                self.franchiseId = ko.observable();
                self.franchiseId(sessionStorage.getItem("userFranchiseId"))

                self.studentsCount = ko.observable();
                self.applicationCount = ko.observable();
                self.finalchoicedCount = ko.observable();
                self.unassignedLeadsCount = ko.observable();
                self.assignedLeadsCount = ko.observable();
                self.orientationValue = ko.observable("vertical");
                self.stackValue = ko.observable("off");
                self.studentPieSeriesValue = ko.observableArray();
                var studentPieSeries;
                self.applicationPieSeriesValue = ko.observableArray();
                var applicationPieSeries;
                self.finalchoicePieSeriesValue = ko.observableArray();
                var finalchoicePieSeries;

                self.selectList = ko.observable("all");
                self.list = [
                    { value: 'all', label: 'All' },
                    { value: 'unAssigned', label: 'Unassigned Leads' },
                    { value: 'assigned', label: 'Assigned Leads' },
                    { value: 'active', label: 'Active' },
                    { value: 'inactive', label: 'Inactive' },
                    { value: 'SPAM', label: 'SPAM' },
                    { value: 'Offer Received', label: 'Offer Received' },
                    { value: 'Deposit Paid', label: 'Deposit Paid' },
                    { value: 'Visa Grant', label: 'Visa Grant' },
                    { value: 'Not Interested', label: 'Not Interested' },
                    { value: 'Rejected', label: 'Rejected' },
                    { value: 'closed', label: 'Closed' }
                ];

                self.listDP = new ArrayDataProvider(self.list, {
                    keyAttributes: 'value'
                });
                
                self.getDashboardCount = ()=>{
                    $.ajax({
                        url: BaseURL+"/getCountOfFranchiseDashboard",
                        type: 'POST',
                        data: JSON.stringify({
                            year: self.selectYear(),
                            franchiseId: self.franchiseId(),
                        }),
                        dataType: 'json',
                        error: function (xhr, textStatus, errorThrown) {
                            console.log(textStatus);
                        },
                        success: function (data) {
                            var studentCount = data[0][0][0]
                            var applicationCount = data[1][0][0]
                            var finalChoiceCount = data[2][0][0]
                            var unAssigneLeadCount = data[3][0][0]
                            if(studentCount=="No data found"){
                                self.studentsCount(0)
                            }
                            else{
                                self.studentsCount(studentCount)
                            }
                            if(applicationCount=="No data found"){
                                self.applicationCount(0)
                            }
                            else{
                                self.applicationCount(applicationCount)
                            }
                            if(finalChoiceCount=="No data found"){
                                self.finalchoicedCount(0)
                            }
                            else{
                                self.finalchoicedCount(finalChoiceCount)
                            }
                            if(unAssigneLeadCount=="No data found"){
                                self.unassignedLeadsCount(0)
                            }
                            else{
                                self.unassignedLeadsCount(unAssigneLeadCount)
                            }
                        }
                    })
                }
                
                self.yearChanged = (e)=>{
                    sessionStorage.setItem("selectYear", self.selectYear());
                    self.getDashboardCount();
                    self.progressLine();
                }

                self.studentData = ko.observableArray([]);
                self.getStudentsData = (status)=>{
                    $.ajax({
                        url: BaseURL+"/getAllFranchiseStudents",
                        type: 'POST',
                        data: JSON.stringify({
                            franchiseId: self.franchiseId(),
                            status: status
                        }),
                        dataType: 'json',
                        error: function (xhr, textStatus, errorThrown) {
                            console.log(textStatus);
                        },
                        success: function (data) {
                            self.studentData([]);
                            if(data[0]!="No data found"){
                                data = JSON.parse(data);
                                let len = data.length;
                                self.assignedLeadsCount(len);
                                for(var i=0;i<len;i++){
                                    var date = data[i][4];
                                    date = new Date(date);
                                    var year = date.getFullYear();
                                    var month = ('0' + (date.getMonth() + 1)).slice(-2);
                                    var day = ('0' + date.getDate()).slice(-2);
                                    date =  `${day}-${month}-${year}`
                                    self.studentData.push({
                                        id: data[i][0],
                                        firstName: data[i][2],
                                        lastName: data[i][3],
                                        dateSubmitted: date,
                                        status: data[i][5]
                                    })
                                }
                            }
                            else{
                                self.assignedLeadsCount(0);
                            }
                        }
                    })
                }
                self.getStudentsData("All")
                self.studentDataProvider = new ArrayDataProvider(self.studentData, {
                    keyAttributes: 'id'
                });
                self.viewProfile = (e)=>{
                    // window.location.href = `/?ojr=studentProfile&id=${e.currentTarget.id}`;
                    window.open(`/?ojr=franchiseStudentProfile&id=${e.currentTarget.id}`, "_blank");
                }

                self.stIdRightClick = ko.observable();
                self.myActionFunction = (event) => {
                    let menu = event.detail.selectedValue;
                    if(menu=="openNewTab"){
                        if(self.stIdRightClick()!=undefined){
                            window.open(`/?ojr=franchiseStudentProfile&id=${self.stIdRightClick()}`, "_blank");
                        }
                    }
                };

                self.myBeforeOpenFunction = (event) => {
                    const target = event.detail.originalEvent.target;
                    const context = document.getElementById("table").getContextByNode(target);
                    self.stIdRightClick(context.key);
                };

                self.progressLine = ()=>{
                    let studentPercentage,applicationPercentage,finalchoicePercentage,unassignedPercentage = 0;
                    let studentTotalCount,applicationTotalCount,finalchoiceCount,unassignedCount = 0;
                    $.ajax({
                        url: BaseURL+"/getFranchiseDashboardCount",
                        type: 'POST',
                        data: JSON.stringify({
                            franchiseId: self.franchiseId(),
                        }),
                        error: function (xhr, textStatus, errorThrown) {
                            console.log(textStatus);
                        },
                        success: function (data) {
                            data = JSON.parse(data);
                            console.log(data);

                            studentTotalCount = data['student_count'];
                            applicationTotalCount = data['application_count'];
                            finalchoiceCount = data['finalchoice_count'];
                            unassignedCount = data['unassigned_count'];
                            

                            studentPercentage =  studentTotalCount ? (self.studentsCount() / studentTotalCount) * 100 : 0;
                            applicationPercentage = applicationTotalCount ? (self.applicationCount() / applicationTotalCount) * 100 : 0;
                            finalchoicePercentage = finalchoiceCount ? (self.finalchoicedCount() / finalchoiceCount) * 100 : 0;
                            unassignedPercentage = unassignedCount ? (self.unassignedLeadsCount() / unassignedCount) * 100 : 0;


                            // Students progress
                            var studentContainer = $(".indicator-container.studentsProgress");
                            let studentMeter = studentContainer.find(".indicator-window > span");
                            studentMeter.css("width", studentPercentage + "%");

                            // Application progress
                            var applicationContainer = $(".indicator-container.applicationProgress");
                            let applicationMeter = applicationContainer.find(".indicator-window > span");
                            applicationMeter.css("width", applicationPercentage + "%");

                            // Final choice progress
                            var finalchoiceContainer = $(".indicator-container.finalProgress");
                            let finalchoiceMeter = finalchoiceContainer.find(".indicator-window > span");
                            finalchoiceMeter.css("width", finalchoicePercentage + "%");

                            // Unassigned leads progress
                            var unassignedContainer = $(".indicator-container.unassignedProgress");
                            let unassignedMeter = unassignedContainer.find(".indicator-window > span");
                            unassignedMeter.css("width", unassignedPercentage + "%");
                            
                            let studentMonthTotal = data['StudentMonthCounts'][0].student_count + data['StudentMonthCounts'][1].student_count + data['StudentMonthCounts'][2].student_count; 
                            studentPieSeries = [
                                {name : data['StudentMonthCounts'][0].month_name, items : [data['StudentMonthCounts'][0].student_count, studentMonthTotal], color: "#ffcc00"},
                                {name : data['StudentMonthCounts'][1].month_name, items : [data['StudentMonthCounts'][1].student_count, studentMonthTotal], color: "#3366cc"},
                                {name : data['StudentMonthCounts'][2].month_name, items : [data['StudentMonthCounts'][2].student_count, studentMonthTotal], color: "#33cc33"} 
                            ];
                            self.studentPieSeriesValue(studentPieSeries);

                            let applicationMonthTotal = data['ApplicationMonthCounts'][0].application_count + data['ApplicationMonthCounts'][1].application_count + data['ApplicationMonthCounts'][2].application_count; 

                            let applicationPieSeries = [
                                {
                                  name: data['ApplicationMonthCounts'][0].month_name,
                                  items: [data['ApplicationMonthCounts'][0].application_count],
                                  color: "#ffcc00"
                                },
                                {
                                  name: data['ApplicationMonthCounts'][1].month_name,
                                  items: [data['ApplicationMonthCounts'][1].application_count],
                                  color: "#3366cc"
                                },
                                {
                                  name: data['ApplicationMonthCounts'][2].month_name,
                                  items: [data['ApplicationMonthCounts'][2].application_count],
                                  color: "#33cc33"
                                }
                              ];
                              
                            self.applicationPieSeriesValue(applicationPieSeries);
                            let finalchoiceMonthTotal = data['FinalChoiceMonthCounts'][0].final_choice_count + data['FinalChoiceMonthCounts'][1].final_choice_count + data['FinalChoiceMonthCounts'][2].final_choice_count; 
                            
                            finalchoicePieSeries = [
                                {name : data['FinalChoiceMonthCounts'][0].month_name, items : [data['FinalChoiceMonthCounts'][0].final_choice_count], color: "#ffcc00"},
                                {name : data['FinalChoiceMonthCounts'][1].month_name, items : [data['FinalChoiceMonthCounts'][1].final_choice_count], color: "#3366cc"},
                                {name : data['FinalChoiceMonthCounts'][2].month_name, items : [data['FinalChoiceMonthCounts'][2].final_choice_count], color: "#33cc33"} 
                            ];
                            self.finalchoicePieSeriesValue(finalchoicePieSeries);
            

                        }
                    })
                }


                self.connected = function () {
                    if (sessionStorage.getItem("userName") == null) {
                        self.router.go({path : 'signin'});
                    }
                    else {
                        app.onAppSuccess();
                        var routes = args.parentRouter._routes;
                        if(routes[2].path!="franchiseDashboard"){
                            location.reload();
                        }
                        self.getDashboardCount()
                        self.progressLine();
                    }
                }


                self.selectedData = (e)=>{
                    let selectVal = e.detail.value;
                    self.getStudentsData(selectVal)
                }

            }
        }
        return  franchiseDashboard;
    }
);