angular.module('starter.controllers', [])

        .controller('DashCtrl', function ($scope, $timeout, $http) {

            var watchID;
            $scope.count = 0;
            $scope.list_coord = [];
            $scope.cod = {codigo: 2};
            var db = null;
            $scope.enable = true;

            $scope.conf = {
                stationaryRadius: 50,
                distanceFilter: 50,
                interval: 10000,
                fastestInterval: 5000,
                activitiesInterval: 10000
            };

            function openSqLite() {
                db = window.sqlitePlugin.openDatabase({name: "mylocations.db", androidDatabaseImplementation: 2});
                db.transaction(function (tx) {
                    tx.executeSql('CREATE TABLE IF NOT EXISTS latlong (lat, long, data, cod)');
                }, function (error) {
                    console.log('Transaction ERROR: ' + error.message);
                });
            }

            function insertCoordenadas(lat, long, timestamp, codigo) {
                openSqLite();
                db.transaction(function (tx) {
                    tx.executeSql('INSERT INTO latlong VALUES (?,?,?,?)', [lat, long, timestamp, codigo]);
                    //$scope.consultaCoordenadas(codigo, false);
                }, function (error) {
                    console.log('Transaction ERROR: ' + error.message);
                });
            }

            $scope.enviarDados = function (codigo) {
                var dados = [];
                openSqLite();
                var sql = 'Select * FROM latlong';
                if (codigo != 0) {
                    sql += " Where cod = " + codigo + "";
                }

                db.executeSql(sql, [], function (rs) {
                    for (var i = 0; i < rs.rows.length; i++) {
                        dados.push({lat: rs.rows.item(i).lat, long: rs.rows.item(i).long, data: rs.rows.item(i).data, cod: rs.rows.item(i).cod});
                    }

                    var config = {
                        headers: {
                            'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8;'
                        }
                    }

                    var url = "http://mydomain.com.br/webService/save";
                   
                    var paramSerializado = dados;
                    $http({
                        method: 'POST',
                        url: url,
                        data: paramSerializado,
                        headers: {'Content-Type': 'application/x-www-form-urlencoded'}
                    }).success(function (result) {
                        alert("Enviou");
                    });
                }, function (error) {
                    alert('SELECT SQL statement ERROR: ' + error.message);
                });
            }

            $scope.apagarDados = function (codigo) {
                var sql = 'DELETE FROM latlong';
                if (codigo != 0) {
                    sql += " Where cod = " + codigo + "";
                }
                db.executeSql(sql, [], function (rs) {
                    $timeout(function () {
                        $scope.list_coord = [];
                        alert('apagou');
                        $scope.consultaCoordenadas(codigo, true);
                    }, 500);
                }, function (error) {
                    alert('SELECT SQL statement ERROR: ' + error.message);
                });
            }

            $scope.consultaCoordenadas = function (codigo, message) {
                openSqLite();
                $scope.list_coord = [];
                var sql = 'Select * FROM latlong';
                if (codigo != 0) {
                    sql += " Where cod = " + codigo + "";
                }

                db.executeSql(sql, [], function (rs) {
                    $timeout(function () {
                        for (var i = 0; i < rs.rows.length; i++) {
                            $scope.list_coord.push({lat: rs.rows.item(i).lat, long: rs.rows.item(i).long, data: rs.rows.item(i).data, cod: rs.rows.item(i).cod});
                        }
                        if (message) {
                            alert("Finalizou");
                        }
                    }, 500);
                }, function (error) {
                    alert('SELECT SQL statement ERROR: ' + error.message);
                });
            }

            var callbackFn = function (location) {
                console.log(location);
                $scope.count++;
                $timeout(function () {
                    var lat = location.latitude;
                    var lng = location.longitude;
                    var time = location.time;
                    insertCoordenadas(lat, lng, time, parseInt($scope.cod.codigo));
                    //$scope.list_coord.push({lat: location.latitude, long: location.longitude, data: location.time, cod: $scope.cod.codigo});
                }, 500);
                //console.log('- Location: ', JSON.stringify(location));
            };

            $scope.configurar = function () {
                BackgroundGeolocation.configure({
                    desiredAccuracy: BackgroundGeolocation.HIGH_ACCURACY,
                    stationaryRadius: $scope.conf.stationaryRadius,
                    distanceFilter: $scope.conf.distanceFilter,
                    notificationTitle: 'Mouron85V3 Background',
                    notificationText: 'enabled new Conf',
                    debug: false,
                    startOnBoot: false,
                    stopOnTerminate: false,
                    locationProvider: BackgroundGeolocation.ACTIVITY_PROVIDER,
                    interval: $scope.conf.interval,
                    fastestInterval: $scope.conf.fastestInterval,
                    activitiesInterval: $scope.conf.activitiesInterval
                });
            }

            document.addEventListener('deviceready', onDeviceReady, false);
            function onDeviceReady() {
                /*
                 distanceFilter: 10,
                 stationaryRadius: 25,
                 */

                $scope.configurar();

                BackgroundGeolocation.on('location', (location) => {
                    //console.log("location", location);
                    callbackFn(location);
                    // handle your locations here
                    // to perform long running operation on iOS
                    // you need to create background task
                    /*BackgroundGeolocation.startTask(taskKey => {
                     // execute long running task
                     // eg. ajax post location
                     // IMPORTANT: task has to be ended by endTask
                     BackgroundGeolocation.endTask(taskKey);
                     });*/
                });

                BackgroundGeolocation.on('stationary', (stationaryLocation) => {
                    // handle stationary locations here
                    //console.log("stationary", stationaryLocation);
                    callbackFn(stationaryLocation);
                });

                BackgroundGeolocation.on('error', (error) => {
                    console.log('[ERROR] BackgroundGeolocation error:', error.code, error.message);
                });
                BackgroundGeolocation.on('start', () => {
                    console.log('[INFO] BackgroundGeolocation service has been started');
                });

                BackgroundGeolocation.on('stop', () => {
                    console.log('[INFO] BackgroundGeolocation service has been stopped');
                });

                BackgroundGeolocation.on('authorization', (status) => {
                    console.log('[INFO] BackgroundGeolocation authorization status: ' + status);
                    if (status !== BackgroundGeolocation.AUTHORIZED) {
                        Alert.alert('Location services are disabled', 'Would you like to open location settings?', [
                            {text: 'Yes', onPress: () => BackgroundGeolocation.showLocationSettings()},
                            {text: 'No', onPress: () => console.log('No Pressed'), style: 'cancel'}
                        ]);
                    }
                });

                BackgroundGeolocation.on('background', () => {
                    console.log('[INFO] App is in background');
                    // you can also reconfigure service (changes will be applied immediately)
                    /*BackgroundGeolocation.configure({
                     locationProvider: BackgroundGeolocation.DISTANCE_FILTER_PROVIDER
                     });*/
                });

                BackgroundGeolocation.on('foreground', () => {
                    console.log('[INFO] App is in foreground');
                    /*BackgroundGeolocation.configure({
                     locationProvider: BackgroundGeolocation.ACTIVITY_PROVIDER
                     });*/
                });

                BackgroundGeolocation.checkStatus(status => {
                    console.log('[INFO] BackgroundGeolocation service is running', status.isRunning);
                    console.log('[INFO] BackgroundGeolocation service has permissions', status.hasPermissions);
                    console.log('[INFO] BackgroundGeolocation auth status: ' + status.authorization);
                    // you don't need to check status before start (this is just the example)
                    /*if (!status.isRunning) {
                     BackgroundGeolocation.start(); //triggers start on start event
                     }*/
                });
            }

            $scope.iniciarMonitoramento = function () {
                $scope.enable = false;
                BackgroundGeolocation.start();
            }

            $scope.pararMonitoramento = function () {
                $scope.enable = true;
                $scope.count = 0;
                BackgroundGeolocation.stop();
            }

        });



