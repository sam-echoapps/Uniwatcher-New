define(['ojs/ojcore',"knockout","jquery","appController", "ojs/ojarraydataprovider"], 
    function (oj,ko,$, app, ArrayDataProvider) {

        class ManageStudentAd {
            constructor(args) {
                var self = this;
                
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
        return  ManageStudentAd;
    }
);