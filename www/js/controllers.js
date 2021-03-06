angular.module('starter.controllers', [])

.controller('AppCtrl', function ($scope, $ionicModal, $timeout) {

    //Blank but this handles showing the side menu


})

//Handles profile creation, login, logout, and password recovery
.controller('LoginCtrl', function ($scope, $stateParams, Auth, $location, $q, Ref, $timeout, $ionicPopup, $state) {
    $scope.passwordLogin = function (email, pass) {
        $scope.err = null;
        Auth.$authWithPassword({
            email: email,
            password: pass
        }, {
            rememberMe: true
        }).then(
            redirect, showError
        );
    };

    $scope.createAccount = function (email, pass, confirm) {
        $scope.err = null;
        if (!pass) {
            var alertPopup = $ionicPopup.alert({
                title: "Error!",
                template: "Please enter a password.",
                okType: 'button-assertive'
            })
        } else if (pass !== confirm) {
            var alertPopup = $ionicPopup.alert({
                title: "Error!",
                template: "Your passwords do not match.",
                okType: 'button-assertive'
            })
        } else {
            Auth.$createUser({
                    email: email,
                    password: pass
                })
                .then(function () {
                    // authenticate so we have permission to write to Firebase
                    return Auth.$authWithPassword({
                        email: email,
                        password: pass
                    }, {
                        rememberMe: true
                    });
                })
                .then(createProfile)
                .then(redirect, showError);
        }

        function createProfile(user) {
            var ref = Ref.child('users').child(user.uid),
                def = $q.defer();
            ref.set({
                email: email,
                name: firstPartOfEmail(email)
            }, function (err) {
                $timeout(function () {
                    if (err) {
                        def.reject(err);
                    } else {
                        def.resolve(ref);
                    }
                });
            });
            return def.promise;
        }
    };


    $scope.recoverPassword = function () {
        Ref.resetPassword({
            email: $scope.recover.email
        }, function (error) {
            if (error) {
                switch (error.code) {
                case "INVALID_USER":
                    Flash.create('danger', "The specified user account does not exist.");
                    console.log("The specified user account does not exist.");
                    break;
                default:
                    Flash.create('danger', "Error resetting password");
                    console.log("Error resetting password:", error);
                }
            } else {
                Flash.create('success', "Password reset email sent successfuly!");
                $scope.passwordMode = false;
                console.log("Password reset email sent successfully!");
            }
        });
    };

    function firstPartOfEmail(email) {
        return ucfirst(email.substr(0, email.indexOf('@')) || '');
    }

    function ucfirst(str) {
        // inspired by: http://kevin.vanzonneveld.net
        str += '';
        var f = str.charAt(0).toUpperCase();
        return f + str.substr(1);
    }



    function redirect() {
        var alertPopup = $ionicPopup.alert({
            title: "Login successful!",
            template: "Redirecting you..."
        })
        console.log($state.previous);
        $state.go($state.previous, {}, {
            location: 'replace'
        });
    }

    function showError(err) {
        var alertPopup = $ionicPopup.alert({
            title: "Error!",
            template: "It seems there's been some kind of error.<br>" + err,
            okType: 'button-assertive'
        })
        $scope.err = err;
        //        }

    }



})

//Shows the user their info and allows password changes
.controller('AccountCtrl', function ($scope, $stateParams, user, Auth, Ref, $firebaseObject, $timeout, $location, $ionicPopup, $state) {
    $scope.user = user;
    $scope.logout = function () {
        Auth.$unauth();
        var alertPopup = $ionicPopup.alert({
            title: "Logged out",
            template: "You have been successfully logged out."
        })
        $state.go("app.home");
    }
    $scope.messages = [];
    var profile = $firebaseObject(Ref.child('users/' + user.uid));
    profile.$bindTo($scope, 'profile');


    $scope.changePassword = function (oldPass, newPass, confirm) {
        $scope.err = null;
        if (!oldPass || !newPass) {
            error('Please enter all fields.');
        } else if (newPass !== confirm) {
            error('Passwords do not match.');
        } else {
            Auth.$changePassword({
                    email: profile.email,
                    oldPassword: oldPass,
                    newPassword: newPass
                })
                .then(function () {
                    success('Password changed.');
                }, error);
        }
    };

    $scope.changeEmail = function (pass, newEmail) {
        $scope.err = null;
        Auth.$changeEmail({
                password: pass,
                newEmail: newEmail,
                oldEmail: profile.email
            })
            .then(function () {
                profile.email = newEmail;
                profile.$save();
                success('Email changed');
            })
            .catch(error);
    };

    $scope.showFlash = function () {
        //        Flash.create('success', "Your information has been saved! Redirecting you to the home page in 5 seconds.");
        success("You have successfully updated your information.");
    }

    function error(err) {
        var alertPopup = $ionicPopup.alert({
            title: "Error!",
            template: "It seems there's been some kind of error.<br>" + err,
            okType: 'button-assertive'
        })
        return alertPopup;
    }

    function success(msg) {
        var alertPopup = $ionicPopup.alert({
            title: "Success",
            template: msg
        })
    }

    function alert(msg, type) {
        var obj = {
            text: msg + '',
            type: type
        };
        $scope.messages.unshift(obj);
        $timeout(function () {
            $scope.messages.splice($scope.messages.indexOf(obj), 1);
        }, 10000);
    }
})

//Sample implementation of a Google Map
.controller('MapCtrl', function ($scope, $stateParams, $firebaseArray, $firebaseObject, geolocation, Ref) {
    geolocation.getLocation().then(function (data) {
        $scope.coords = {
            lat: data.coords.latitude,
            lon: data.coords.longitude
        };

        $scope.scores = $firebaseArray(Ref.child('scores').limitToLast(250));

        //This gives the nice blue Apple icon. Implement as desired        
        $scope.icon = {
            url: 'http://plebeosaur.us/etc/map/bluedot_retina.png',
            size: null, // size
            origin: null, // origin
            anchor: new google.maps.Point(8, 8), // anchor (move to center of marker)
            scaledSize: new google.maps.Size(17, 17) // scaled size (required for Retina display icon)
        };


    }).catch(function (error) {

    });
})

//Shows the front page of the application
.controller('HomeCtrl', function ($scope, $stateParams, geolocation) {
    geolocation.getLocation().then(function (data) {
        $scope.coords = {
            lat: data.coords.latitude,
            lon: data.coords.longitude
        };
    });

});