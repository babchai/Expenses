angular.module('starter.controllers', [])

.controller('DashCtrl', function($scope, $http, $rootScope, $localstorage, $state) {


	var today = new Date();
	var dd = today.getDate();
	var mm = today.getMonth()+1; //January is 0!
	var yyyy = today.getFullYear();
	var hour = today.getHours();
	var minute = today.getMinutes();
	
	$scope.category = "";
	$scope.expenses={};


	$http.get('./models/category.json')
       .then(function(res){
       	//console.log(res);
          $scope.categories = chunk(res.data, 5);   
        });

   var settings = $localstorage.get('settings');     

    if(typeof settings != "undefined"){
      settings = JSON.parse(settings);
      $scope.expenses.currency = settings.currency.label;
    }
    else
    { 
       $http.get('./models/settings.json')
       .then(function(res){
           console.log(res);
          $scope.expenses.currency = res.data.default.currency;
        });
    }


   $scope.expenses.date = today;
    
  
    function chunk(arr, size) {
	  var newArr = [];
	  for (var i=0; i<arr.length; i+=size) {
	    newArr.push(arr.slice(i, i+size));
	  }
	  return newArr;
	}
   
    $scope.selected=function( $label, $event){
    	$elemet =  angular.element($event.currentTarget);
    	if($elemet.parent().hasClass('selected')){
    		$elemet.parent().removeClass('selected');
    		$scope.expenses.category = "";


    	}
    	else
    	{
   			$e = angular.element(document.getElementsByClassName('selected'));
			$e.removeClass('selected');
    		$elemet.parent().addClass('selected');
    		//console.log($label);
    		$scope.expenses.category = $label;


    	} 

    }

    $scope.save = function(){


    	console.log(this.expenses);
      var date = new Date(this.expenses.date);
      var dd = date.getDate();
      var mm = date.getMonth()+1; //January is 0!
      var yyyy = date.getFullYear();

      this.expenses.date = yyyy+"-"+mm+"-"+dd;
	
    	var data = $localstorage.get('expenses');
    	if(typeof data != 'undefined' ){
    		console.log(data);

    		data = JSON.parse(data);
    	}
    	else
    	{
    		data = [];
    	}

        data.push(this.expenses);
        $localstorage.set('expenses', JSON.stringify(data));

        $state.go('tab.chats', {}, {reload: true});


    }

    $scope.getPhoto = function() {
	    navigator.camera.getPicture(onSuccess, onFail, { quality: 75, targetWidth: 320,
	    targetHeight: 320, destinationType: 0 }); 
	    //destination type was a base64 encoding
	    function onSuccess(imageData) {
	    	//console.log(imageData);
	        //preview image on img tag
	       // $('#image-preview').attr('src', "data:image/jpeg;base64,"+imageData);

	       $scope.preview_image = "data:image/jpeg;base64,"+imageData;
	        //setting scope.lastPhoto 
	        //console.log(imageData);
            $scope.expenses.photo =  "data:image/jpeg;base64,"+imageData;
	       // $scope.expenses.photo = dataURItoBlob("data:image/jpeg;base64,"+imageData);

	        $scope.$apply();
	    }
	    function onFail(message) {
	        alert('Failed because: ' + message);
	    }
	} 
	function dataURItoBlob(dataURI) {
		// convert base64/URLEncoded data component to raw binary data held in a string
		 var byteString = atob(dataURI.split(',')[1]);
		 var mimeString = dataURI.split(',')[0].split(':')[1].split(';')[0]

		 var ab = new ArrayBuffer(byteString.length);
		 var ia = new Uint8Array(ab);
		 for (var i = 0; i < byteString.length; i++)
		 {
		    ia[i] = byteString.charCodeAt(i);
		 }

		 var bb = new Blob([ab], { "type": mimeString });
		 return bb;
	}
})

.controller('ChatsCtrl', function($scope, Chats, $localstorage, $http, $filter, Categories, _) {
    
    var expenses = JSON.parse($localstorage.get('expenses'));
     
    $scope.expenses = expenses;

    $scope.datasets = _.groupBy(expenses, 'date');

    $http.get('./models/currencies.json')
         .then(function(res){
            for(var j=0 ; j<res.data.length; j++)
            {
              if(res.data[j].label == "MYR"){
                  for(key in $scope.datasets){
                    var total = 0;
                    for(var i = 0; i< $scope.datasets[key].length; i++)
                    {
                        //datasets[key][i].convertedAmount = res.data[j].rate[datasets[key][i].currency] *  datasets[key][i].amount;
                        console.log(res.data[j].rate[$scope.datasets[key][i].currency]);
                        if(typeof res.data[j].rate[$scope.datasets[key][i].currency] == "undefined")
                           res.data[j].rate[$scope.datasets[key][i].currency] = 1;

                        total = total + ($scope.datasets[key][i].amount *res.data[j].rate[$scope.datasets[key][i].currency]);
                    }
                    $scope.datasets[key]['total'] = parseFloat(total).toFixed(2);
                  }
              }
            }
        });

    
   
    $scope.doRefresh = function(){

       var expenses = $localstorage.get('expenses');
       $scope.expenses = JSON.parse(expenses);
        $scope.$broadcast('scroll.refreshComplete');

    };
})

.controller('ChatDetailCtrl', function($scope, $stateParams, $localstorage, $http) {
   // $scope.chat = Chats.get($stateParams.chatId);
   
    $scope.Details = [];
    $scope.title = $stateParams.key; 
    $scope.total = 0;

   var total = 0
    var expenses = $localstorage.get('expenses');
    expenses = JSON.parse(expenses);

    $http.get('./models/currencies.json')
       .then(function(res){
            for(var i=0 ; i<res.data.length; i++)
            {
               if(res.data[i].label == "MYR"){
                 for(var j=0 ; j<expenses.length; j++)
                  {
                     if(expenses[j].date == $stateParams.key){

                        if(typeof res.data[i].rate[expenses[j].currency] == "undefined")
                           res.data[i].rate[expenses[j].currency] = 1;

                        var rate = res.data[i].rate[expenses[j].currency];
                        expenses[j].amount = expenses[j].amount * rate;
                        $scope.Details.push(expenses[j]);
                         total = total + expenses[j].amount;
                        console.log(total);
                        $scope.total = total.toFixed(2);
                     }
                  }
               }
            }
        });
})

.controller('AccountCtrl', function($scope, $rootScope, $localstorage, $state, $http) {
    //$scope.currencies=
    console.log("flag");
    $http.get('./models/currencies.json')
       .then(function(res){
          console.log(res.data);
          $scope.currencies = res.data;

           $rootScope.settings = { 
            'enableFriends': true, 
             'currency': $scope.currencies[1] 
           };
        });

   


    $scope.$on('$stateChangeStart', 
    function(event, toState, toParams, fromState, fromParams){
      if(fromState.name == "tab.account"){
          console.log($rootScope.settings);
          $localstorage.set('settings', JSON.stringify($rootScope.settings))

       }
    })

    $scope.reset = function(){
    	$localstorage.clear('expenses');
    }

})
.controller('ChartCtrl', function($scope, $rootScope, $localstorage, $state, $http, _) {
   
   $scope.labels = [];
   $scope.data = [];
   $scope.legend = true;

   var expenses = $localstorage.get('expenses');
   expenses = JSON.parse(expenses);
   console.log(expenses);
   expenses = _.groupBy(expenses, function(obj){
      return obj.category.label;
   });

   for(label in expenses){

      $scope.labels.push(label);
      console.log(label);
      var total = 0;
      for(var i=0; i < expenses[label].length; i++){
        total = total + expenses[label][i].amount;
      }
      //console.log(total)
      $scope.data.push(total);
   }

   console.log(expenses);

              

});
