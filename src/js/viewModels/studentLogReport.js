define(['ojs/ojcore',"knockout","jquery","appController", "ojs/ojarraydataprovider", "ojs/ojconverterutils-i18n",
    "ojs/ojlistdataproviderview","ojs/ojdataprovider",
    "ojs/ojdatetimepicker", "ojs/ojlabel", "ojs/ojselectsingle", "ojs/ojradioset", 
    "ojs/ojselectcombobox", "ojs/ojtable", "ojs/ojpopup", "ojs/ojprogress-circle", "ojs/ojcheckboxset", "ojs/ojmenu"], 
    function (oj,ko,$, app, ArrayDataProvider, ojconverterutils_i18n_1, ListDataProviderView, ojdataprovider_1) {

        class StudentLogReport {
            constructor(args) {
                var self = this;
                
                self.router = args.parentRouter;
                let BaseURL = sessionStorage.getItem("BaseURL")
                
                self.officeId = ko.observable();
                self.userRole = ko.observable(sessionStorage.getItem("userRole"));

                const currentDate = new Date();
                const year = currentDate.getFullYear();
                const month = currentDate.getMonth();
                const day = currentDate.getDate();

                self.fromDate = ko.observable(ojconverterutils_i18n_1.IntlConverterUtils.dateToLocalIsoDateString(new Date(year, month, day)));
                self.datePicker = {
                    numberOfMonths: 1
                };
                self.toDate = ko.observable(ojconverterutils_i18n_1.IntlConverterUtils.dateToLocalIsoDateString(new Date(year, month,day)));

                self.selectOffice = ko.observable();

                self.offices = [];

                self.getOffices = ()=>{
                    $.ajax({
                        url: BaseURL+"/getOffices",
                        type: 'GET',
                        error: function (xhr, textStatus, errorThrown) {
                            console.log(textStatus);
                        },
                        success: function (data) {
                            if(data[0] != "No data found"){
                                data = JSON.parse(data);
                                let len = data.length;
                                self.offices.push({value: `All`, label: `All`})
                                for(let i=0;i<len;i++){
                                    self.offices.push({value: `${data[i][0]}`, label: `${data[i][1]}`})
                                }
                                if(self.userRole()=="admin" || self.userRole()=="director"){
                                    self.officeId(["All"])
                                }
                                else{
                                    self.officeId(sessionStorage.getItem(["userOfficeId"]));
                                    self.getCounsilors(self.officeId())
                                }
                            }
                        }
                    })
                }
                self.officesDP = new ArrayDataProvider(self.offices, {
                    keyAttributes: 'value'
                });
                self.getOffices()
                
                self.officeChangedHandler = (event) => {
                    let offices = event.detail["value"];
                    offices = offices.join(",");
                    self.getCounsilors(offices);
                };
                
                self.selectStaff = ko.observable();
                self.staffs = ko.observableArray();
                self.getCounsilors = (officeId)=>{
                    self.staffs([])
                    $.ajax({
                        url: BaseURL+"/getOfficesCounsilors",
                        type: 'POST',
                        data: JSON.stringify({
                            officeId: officeId,
                        }),
                        dataType: 'json',
                        error: function (xhr, textStatus, errorThrown) {
                            console.log(textStatus);
                        },
                        success: function (data) {
                            if(data[0]!="No data found"){
                                data = JSON.parse(data);
                                let len = data.length;
                                self.staffs.push({value: `All`, label: `All`})
                                for(let i=0;i<len;i++){
                                    self.staffs.push({value: `${data[i][0]}`, label: `${data[i][3]}`})
                                }
                            }
                        }
                    })
                }
                self.staffsDP = new ArrayDataProvider(self.staffs, {
                    keyAttributes: 'value'
                });

                self.recordsCount = ko.observable(0);

                self.comparator = (a, b) => {
                    if (a === b) {
                        return 0;
                    }
                    const dateA = new Date(a).getTime();
                    const dateB = new Date(b).getTime();
                    return dateA < dateB ? -1 : 1;
                };

                self.filter = ko.observable('');
                self.logReportData = ko.observableArray();
                
                self.logReportDataprovider = ko.computed(function () {
                    let filterCriterion = null;
                    if (self.filter() && self.filter() != '') {
                        filterCriterion = ojdataprovider_1.FilterFactory.getFilter({
                            filterDef: { text: self.filter() }
                        });
                    }
                    const arrayDataProvider = new ArrayDataProvider(self.logReportData, { 
                        keyAttributes: 'studentId',
                        sortComparators: {
                            comparators: new Map().set("dateLogAdded", self.comparator),
                        },
                    });
                    
                    return new ListDataProviderView(arrayDataProvider, { filterCriterion: filterCriterion });
                }, self);

                self.handleValueChanged = () => {
                    self.filter(document.getElementById('filter').rawValue);
                };
                
                self.blob = ko.observable();
                self.fileName = ko.observable();

                self.showData = ()=>{
                    let fromDate = self.fromDate()
                    let toDate = self.toDate();
                    let office = self.officeId();
                    if(self.userRole() == "admin" || self.userRole() == "director"){
                        office = office.join(",");
                    }
                    let staff = self.selectStaff();
                    staff = staff.join(",");
                    let popup = document.getElementById("progressBar");
                    popup.open();
                    self.logReportData([])
                    $.ajax({
                        url: BaseURL+"/getStudentLogReport",
                        type: 'POST',
                        data: JSON.stringify({
                            fromDate: fromDate,
                            toDate: toDate,
                            officeId: office,
                            staffId: staff
                        }),
                        dataType: 'json',
                        error: function (xhr, textStatus, errorThrown) {
                            console.log(textStatus);
                        },
                        success: function (data) {
                            self.logReportData([])
                            if(data[0]!='No data found'){
                                data = JSON.parse(data);
                                let len = data.length;
                                self.recordsCount(len)

                                var csvContent = '';
                                var headers = ['Student Id', 'Name', 'Reminder Date', 'Date log Added','Notes', 'Counsellor', 
                                                'Staff Added Note',  'Contact Type', 'Office'];
                                csvContent += headers.join(',') + '\n';

                                for(var i=0;i<len;i++){
                                    self.logReportData.push({
                                        studentId:data[i][0],
                                        name:`${data[i][1]} ${data[i][2]}`,
                                        reminderDate:data[i][3],
                                        dateLogAdded:data[i][4],
                                        notes:data[i][5],
                                        staffAddedNote:data[i][6],
                                        counsellor:data[i][7],
                                        contactType:data[i][8],
                                        office:data[i][9]
                                    })

                                    var rowData = [data[i][0], `${data[i][1]} ${data[i][2]}`, data[i][3], data[i][4], data[i][5], data[i][6], data[i][7], 
                                                data[i][8], data[i][9]]; 
                                    csvContent += rowData.join(',') + '\n';
                                }
                                var blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
                                var today = new Date();
                                var fileName = 'Student_Log_Report_' + today.getFullYear() + '-' + (today.getMonth() + 1) + '-' + today.getDate() + '.csv';
                                self.blob(blob);
                                self.fileName(fileName);
                            }
                            else{
                                self.recordsCount(0)
                                var csvContent = '';
                                var headers = ['Student Id', 'First name', 'Last Name', 'Email', 'Contact','Enquiry Date', 'Status', 
                                                'Marketing',  'Last Note', 'Office'];
                                csvContent += headers.join(',') + '\n';
                                var rowData = []; 
                                csvContent += rowData.join(',') + '\n';
                                var blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
                                var today = new Date();
                                var fileName = 'Student_Log_Report_' + today.getFullYear() + '-' + (today.getMonth() + 1) + '-' + today.getDate() + '.csv';
                                self.blob(blob);
                                self.fileName(fileName);
                            }
                            let popup = document.getElementById("progressBar");
                            popup.close();
                        }
                    })
                }

                self.downloadData = ()=>{
                    if(self.blob() != undefined && self.fileName() != undefined){
                        if (window.navigator && window.navigator.msSaveOrOpenBlob) {
                            // For Internet Explorer
                            window.navigator.msSaveOrOpenBlob(self.blob(), self.fileName());
                        } 
                        else {
                            // For modern browsers
                            var link = document.createElement('a');
                            link.href = window.URL.createObjectURL(self.blob());
                            link.download = self.fileName();
                            link.style.display = 'none';
                            document.body.appendChild(link);
                            link.click();
                            document.body.removeChild(link);
                        }
                    }
                }

                self.viewProfile = (e)=>{
                    // window.location.href = `/?ojr=studentProfile&id=${e.currentTarget.id}`;
                    window.open(`/?ojr=studentProfile&id=${e.currentTarget.id}`, "_blank");
                }

                self.stIdRightClick = ko.observable();
                self.myActionFunction = (event) => {
                    let menu = event.detail.selectedValue;
                    if(menu=="openNewTab"){
                        if(self.stIdRightClick()!=undefined){
                            window.open(`/?ojr=studentProfile&id=${self.stIdRightClick()}`, "_blank");
                        }
                    }
                };

                self.myBeforeOpenFunction = (event) => {
                    const target = event.detail.originalEvent.target;
                    const context = document.getElementById("table").getContextByNode(target);
                    self.stIdRightClick(context.key);
                };

                self.connected = function () {
                    if (sessionStorage.getItem("userName") == null) {
                        self.router.go({path : 'signin'});
                    }
                    else {
                        app.onAppSuccess();
                    }
                }

            }
        }
        return  StudentLogReport;
    }
);