(function e(t,r,a){function o(i,s){if(!r[i]){if(!t[i]){var u=typeof require=="function"&&require;if(!s&&u)return u(i,!0);if(n)return n(i,!0);throw new Error("Cannot find module '"+i+"'")}var c=r[i]={exports:{}};t[i][0].call(c.exports,function(e){var r=t[i][1][e];return o(r?r:e)},c,c.exports,e,t,r,a)}return r[i].exports}var n=typeof require=="function"&&require;for(var i=0;i<a.length;i++)o(a[i]);return o})({1:[function(e,t,r){"use strict";e("./core/session");e("./core/title");e("./core/index");e("./core/loading");e("./core/message");e("./core/explore");e("./core/dashboard");e("angular-elastic/elastic");e("./common/leaflet");e("./common/directives");e("./user/app");e("./feature/app");e("./content/app");e("./layer/app");e("./map/app");var a=angular.extend({server:"local",apiPrefix:"/api/v1"},e("./config"));angular.module("mapasColetivos",["ui.router","ui.keypress","monospaced.elastic","ngRoute","ngAnimate","mapasColetivos.user","mapasColetivos.pageTitle","mapasColetivos.directives","mapasColetivos.session","mapasColetivos.index","mapasColetivos.dashboard","mapasColetivos.explore","mapasColetivos.loadingStatus","mapasColetivos.messageStatus","mapasColetivos.map","mapasColetivos.layer","mapasColetivos.feature","mapasColetivos.content"]).value("apiPrefix",(a.server=="local"?"":a.server)+a.apiPrefix).config(["$stateProvider","$urlRouterProvider","$locationProvider","$httpProvider",function(e,t,r,a){a.defaults.withCredentials=true;t.otherwise("/");e.state("home",{url:"/",controller:"IndexCtrl",templateUrl:"/home"});r.html5Mode(true);var o=["$rootScope","$q","$location",function(e,t,r){function a(e){return e;""}function o(e){var r=e.status;if(r==401){window.location="/login";return}return t.reject(e)}return function(e){return e.then(a,o)}}];a.responseInterceptors.push(o)}])},{"./common/directives":2,"./common/leaflet":4,"./config":6,"./content/app":7,"./core/dashboard":11,"./core/explore":12,"./core/index":13,"./core/loading":14,"./core/message":15,"./core/session":16,"./core/title":17,"./feature/app":18,"./layer/app":24,"./map/app":29,"./user/app":33,"angular-elastic/elastic":36}],2:[function(e,t,r){"use strict";angular.module("mapasColetivos.directives",["ngSanitize","fitVids"]).directive("disableEnterKey",[function(){return{link:function(e,t){function r(){t.blur()}function a(e){if(e.which==13){r();e.preventDefault()}}t.on("keydown keypress",a)}}}]).directive("dynamic",["$compile",function(e){return function(t,r,a){t.$watch(function(e){return e.$eval(a.dynamic)},function(a){r.html(a);e(r.contents())(t)})}}])},{}],3:[function(e,t,r){"use strict";angular.module("mapasColetivos.geocode",[]).factory("GeocodeService",["$http",function(e){return{get:function(t){return e.jsonp("http://nominatim.openstreetmap.org/search.php?q="+t+"&format=json&json_callback=JSON_CALLBACK")}}}])},{}],4:[function(e,t,r){"use strict";angular.module("mapasColetivos.leaflet",[]).factory("MapService",[function(){var t,r=L.featureGroup(),a=[],o=[],n=[],i="http://{s}.tiles.mapbox.com/v3/tmcw.map-7s15q36b/{z}/{x}/{y}.png";var s=e("../feature/featureToMapObjService");return{init:function(e,a){this.destroy();t=L.mapbox.map(e,null,a);t.whenReady(function(){t.addLayer(L.tileLayer(i));t.addLayer(r)});return t},get:function(){return t},clearMarkers:function(){if(o.length){angular.forEach(o,function(e){if(r.hasLayer(e))r.removeLayer(e)});o=[]}},getMarkerLayer:function(){return r},addMarker:function(e){r.addLayer(e);o.push(e)},removeMarker:function(e){o=o.filter(function(t){return t!==e});r.removeLayer(e)},hideMarker:function(e){if(o.indexOf(e)!==-1){r.removeLayer(e);n.push(e);o=o.filter(function(t){return t!==e})}},showMarker:function(e){if(n.indexOf(e)!==-1){r.addMarker(e);o.push(e);n=o.filter(function(t){return t!==e})}},showAllMarkers:function(){if(n.length){angular.forEach(n,function(e){this.showMarker(e)})}},fitWorld:function(){t.setView([0,0],2)},fitMarkerLayer:function(){if(t instanceof L.Map){t.invalidateSize(false);if(o.length){t.fitBounds(r.getBounds())}}return t},addLayer:function(e){var r=this;var o=[];var n=L.featureGroup();n.mcLayer=e;a.push(n);angular.forEach(e.features,function(e){var t=s(e);t.mcFeature=e;o.push(t);n.addLayer(t)});n.addTo(t);return{markerLayer:n,markers:o}},clearGroups:function(){if(a.length){angular.forEach(a,function(e){if(t.hasLayer(e))t.removeLayer(e)})}a=[]},clearAll:function(){this.clearMarkers();this.clearGroups()},destroy:function(){this.clearAll();if(t instanceof L.Map)t.remove();t=null}}}])},{"../feature/featureToMapObjService":21}],5:[function(e,t,r){"use strict";angular.module("mapasColetivos.sirTrevor",[]).directive("sirTrevorEditor",["apiPrefix",function(e){return{link:function(t,r,a){SirTrevor.setDefaults({uploadUrl:e+"/images"});t.sirTrevor=new SirTrevor.Editor({el:jQuery(r),blockTypes:["Embedly","Text","List","Image","Video"],defaultType:"Text",required:"Text"})}}}]).factory("SirTrevor",[function(){var e={vimeo:{regex:/(?:http[s]?:\/\/)?(?:www.)?vimeo.com\/(.+)/,html:'<iframe src="{{protocol}}//player.vimeo.com/video/{{remote_id}}?title=0&byline=0" width="580" height="320" frameborder="0"></iframe>'},youtube:{regex:/(?:http[s]?:\/\/)?(?:www.)?(?:(?:youtube.com\/watch\?(?:.*)(?:v=))|(?:youtu.be\/))([^&].+)/,html:'<iframe src="{{protocol}}//www.youtube.com/embed/{{remote_id}}" width="580" height="320" frameborder="0" allowfullscreen></iframe>'}};return{render:function(e){var t=this;var r="";angular.forEach(e,function(e){r+=t.renderBlock(e)});return r},renderBlock:function(t){var r="";switch(t.type){case"text":r+='<div class="text">'+markdown.toHTML(t.data.text)+"</div>";break;case"list":r+='<div class="list">'+markdown.toHTML(t.data.text)+"</div>";break;case"image":r+='<div class="image"><img src="'+t.data.file.url+'" /></div>';break;case"video":r+='<div class="video" fit-vids>'+e[t.data.source].html.replace("{{protocol}}",window.location.protocol).replace("{{remote_id}}",t.data.remote_id)+"</div>";break}return r}}}])},{}],6:[function(e,t,r){"use strict";var a={server:"local",apiPrefix:"/api/v1"};t.exports=a},{}],7:[function(e,t,r){"use strict";e("../common/sirTrevor");angular.module("mapasColetivos.content",["mapasColetivos.sirTrevor"]).factory("Content",e("./service").Content).controller("ContentCtrl",e("./controller").ContentCtrl).controller("ContentEditCtrl",e("./editController").ContentEditCtrl)},{"../common/sirTrevor":5,"./controller":8,"./editController":9,"./service":10}],8:[function(e,t,r){"use strict";r.ContentCtrl=["$scope","$rootScope","$stateParams","SirTrevor","Content","Feature","MapService",function(e,t,r,a,o,n,i){e.objType="content";e.$content=o;t.$on("data.ready",function(t,r){var a=true;e.$watch("$content.get()",function(t){e.contents=t;if(a){s();a=false}})});e.renderBlock=function(e){return a.renderBlock(e)};var s=function(){if(r.contentId&&e.contents){var t=e.contents.filter(function(e){return e._id==r.contentId})[0];e.view(t);return true}return false};var u=false;var c,l;e.view=function(r){if(!r)return false;c=o.get();l=n.get();u=true;var a=o.getFeatures(r,angular.copy(l));if(a){n.set(a)}t.$broadcast("content.filtering.started",r,a);e.content=r;e.content.featureObjs=a};e.close=function(){if(typeof l!=="undefined")n.set(l);e.content=false;i.fitMarkerLayer();u=false;t.$broadcast("content.filtering.closed")};e.new=function(){o.edit({})};e.edit=function(t){o.edit(angular.copy(e.contents.filter(function(e){return e._id==t})[0]));setTimeout(function(){window.dispatchEvent(new Event("resize"));document.getElementById("content-edit-body").scrollTop=0},100)};t.$on("$stateChangeSuccess",function(){if(!s()&&u){e.close()}});e.$on("layerObjectChange",e.close);e.$on("$stateChangeStart",e.close)}]},{}],9:[function(e,t,r){"use strict";r.ContentEditCtrl=["$scope","$rootScope","Content","Layer","MessageService","SirTrevor","MapService",function(e,t,r,a,o,n,i){var s,u;e.$layer=a;e.$watch("$layer.edit()",function(e){u=e});e.$content=r;e.$watch("$content.get()",function(t){e.contents=t});e.$watch("$content.edit()",function(t){e.editing=t});e.$watch("editing",function(t){s=angular.copy(t);e.tool=false});e.$watch("editing.sirTrevor",function(t){setTimeout(function(){e.sirTrevor.reinitialize()},20)});e.save=function(){e.sirTrevor.onFormSubmit();e.editing.type="Post";e.editing.sirTrevorData=e.sirTrevor.dataStore.data;e.editing.sirTrevor=e.sirTrevor.el.value;if(e.editing&&e.editing._id){r.resource.update({contentId:e.editing._id},e.editing,function(t){e.editing=angular.copy(t);s=angular.copy(t);angular.forEach(e.contents,function(t,r){if(t._id==e.editing._id)e.contents[r]=e.editing});r.set(e.contents);o.message({status:"ok",text:"Conteúdo salvo."})},function(e){if(e.status==500)o.message({status:"error",text:"Ocorreu um erro interno. Tente novamente ou entre em contato com nossa equipe"},false);else{o.message({status:"error",text:"Ocorreu um erro interno. Tente novamente ou entre em contato com nossa equipe"},false)}})}else{e.editing.layer=u._id;var t=new r.resource(e.editing);t.$save(function(t){s=angular.copy(t);e.contents.push(t);r.set(e.contents);r.edit(angular.copy(t));o.message({status:"ok",text:"Conteúdo adicionado."})},function(e){var t={status:"error"};if(e.status==400&&e.data.message){t.text=e.data.message}else{t.text="Ocorreu um erro interno."}o.message(t,false)})}};e.delete=function(){if(confirm("Você tem certeza que deseja remover este conteúdo?")){r.resource.delete({contentId:e.editing._id},function(){r.set(e.contents.filter(function(t){return t._id!==e.editing._id}));r.edit(false);o.message({status:"ok",text:"Conteúdo removido."})},function(e){var t={status:"error"};if(e.status==400&&e.data.message){t.text=e.data.message}else{t.text="Ocorreu um erro interno."}o.message(t,false)})}};e.close=function(){if(e.editing){r.edit(false);setTimeout(function(){i.fitMarkerLayer()},200)}};e.hasFeature=function(t){if(e.editing&&e.editing.features){return e.editing.features.filter(function(e){return e==t}).length}return false};e.toggleFeature=function(t){if(!e.editing.features)e.editing.features=[];var r=angular.copy(e.editing.features);if(e.hasFeature(t)){r=r.filter(function(e){return e!==t})}else{r.push(t)}e.editing.features=r};e.clearFeatures=function(){e.editing.features=[]};e.tool=false;e.setTool=function(t){if(t==e.tool)e.tool=false;else e.tool=t};e.isRevertable=function(){return!angular.equals(e.editing,s)&&e.editing&&e.editing._id};e.revert=function(){e.editing=angular.copy(s)};e.$on("layerObjectChange",e.close);e.$on("$stateChangeStart",e.close);e.$on("layer.saved.success",function(){if(e.editing){e.save(true)}})}]},{}],10:[function(e,t,r){"use strict";r.Content=["$resource","apiPrefix",function(e,t){var r=[];var a=false;return{resource:e(t+"/contents/:contentId",{},{save:{method:"POST",url:t+"/contents",params:{layer:"@id"}},"delete":{method:"DELETE",url:t+"/contents/:contentId"},update:{method:"PUT"}}),set:function(e){r=e},add:function(e){r.push(e)},get:function(){return r},edit:function(e){if(typeof e!=="undefined")a=e;return a},getFeatures:function(e,t){if(e.features.length){if(t&&t.length){var r=t.filter(function(t){return e.features.indexOf(t._id)!==-1});return r}}return false}}}]},{}],11:[function(e,t,r){"use strict";angular.module("mapasColetivos.dashboard",[]).config(["$stateProvider",function(e){e.state("dashboard",{url:"/dashboard",controller:"DashboardCtrl",templateUrl:"/views/dashboard/index.html"}).state("dashboard.profile",{url:"/profile",templateUrl:"/views/dashboard/profile.html"})}]).controller("DashboardCtrl",["$scope","$rootScope","$state","$stateParams","SessionService","$location","Page","Layer","Map",function(e,t,r,a,o,n,i,s,u){i.setTitle("Painel de Controle");if(!o.authenticated){window.location="/login"}e.user=o.user;e.user.grvtr=grvtr.create(e.user.email,{size:58,defaultImage:"mm",rating:"g"});var c=function(){if(r.current.name==="dashboard")n.path("/dashboard/layers").replace();e.currentState=r.current.name.replace("dashboard.","")};c();t.$on("$stateChangeSuccess",function(){c()});s.resource.query({creatorOnly:true},function(t){e.layers=t.layers});u.resource.query({creatorOnly:true},function(t){e.maps=t.maps});t.$on("map.delete.success",function(t,r){e.maps=e.maps.filter(function(e){return r._id!=e._id})});t.$on("layer.delete.success",function(t,r){e.layers=e.layers.filter(function(e){return r._id!=e._id})})}])},{}],12:[function(e,t,r){"use strict";angular.module("mapasColetivos.explore",[]).config(["$stateProvider",function(e){e.state("explore",{url:"/explore",controller:"ExploreCtrl",templateUrl:"/views/explore.html"})}]).controller("ExploreCtrl",["$scope","Page",function(e,t){t.setTitle("Explore")}])},{}],13:[function(e,t,r){"use strict";angular.module("mapasColetivos.index",[]).controller("IndexCtrl",["$scope","SessionService","$location",function(e,t,r){if(t.authenticated){r.path("/dashboard").replace()}}])},{}],14:[function(e,t,r){"use strict";angular.module("mapasColetivos.loadingStatus",[]).config(["$httpProvider",function(e){e.interceptors.push("loadingStatusInterceptor")}]).directive("loadingStatusMessage",function(){return{link:function(e,t,r){var a=function(){t.addClass("active")};var o=function(){t.removeClass("active")};e.$on("loadingStatusActive",a);e.$on("loadingStatusInactive",o);o()}}}).factory("loadingStatusInterceptor",["$q","$rootScope","$timeout",function(e,t,r){var a=0;var o=function(){if(a==0){t.$broadcast("loadingStatusActive")}a++};var n=function(){a--;if(a==0){t.$broadcast("loadingStatusInactive")}};return{request:function(t){o();return t||e.when(t)},response:function(t){n();return t||e.when(t)},responseError:function(t){n();return e.reject(t)}}}])},{}],15:[function(e,t,r){"use strict";angular.module("mapasColetivos.messageStatus",[]).factory("MessageService",["$timeout",function(e){var t={status:"ok",text:false};return{message:function(r,a){if(typeof r!=="undefined"){t=r;if(a!==false){a=a?a:3e3;e(function(){t={status:"ok",text:""}},a)}}return t}}}]).controller("MessageCtrl",["$scope","MessageService",function(e,t){e.service=t;e.$watch("service.message()",function(t){e.message=t});e.close=function(){e.service.message(false)}}])},{}],16:[function(e,t,r){"use strict";angular.module("mapasColetivos.session",[]).factory("SessionService",[function(){var e=this;e._data={authenticated:!!window.isAuthenticated,user:window.user};return e._data}])},{}],17:[function(e,t,r){"use strict";angular.module("mapasColetivos.pageTitle",[]).factory("Page",[function(){var e="Mapas Coletivos";var t=e;return{title:function(){return t},setTitle:function(r){t=r+" - "+e}}}]).controller("PageCtrl",["$scope","Page",function(e,t){e.page=t}])},{}],18:[function(e,t,r){"use strict";angular.module("mapasColetivos.feature",[]).factory("Feature",e("./service").Feature).controller("FeatureCtrl",e("./controller").FeatureCtrl).controller("FeatureEditCtrl",e("./editController").FeatureEditCtrl)},{"./controller":19,"./editController":20,"./service":22}],19:[function(e,t,r){"use strict";var a=e("./featureToMapObjService");r.FeatureCtrl=["$scope","$rootScope","$state","$stateParams","$location","Feature","Content","MapService",function(e,t,r,o,n,i,s,u){e.objType="feature";e.$feature=i;t.$on("data.ready",function(){var t=true;e.$watch("$feature.get()",function(r){e.features=r;l(true);if(t){m();t=false}})});var c;var l=function(r){if(!angular.equals(c,e.features)||r===true){c=angular.copy(e.features);u.clearMarkers();if(e.features){angular.forEach(e.features,function(e){var r=a(e);if(r){r.on("click",function(){t.$broadcast("markerClicked",e)}).on("mouseover",function(){r.openPopup()}).on("mouseout",function(){r.closePopup()}).bindPopup('<h3 class="feature-title">'+e.title+"</h3>");u.addMarker(r)}})}}if(e.features&&e.features.length){setTimeout(function(){u.fitMarkerLayer()},200)}};var f=false;var d,p;e.view=function(r){d=s.get();p=i.get();e.close(false);f=true;e.feature=r;var a=i.getContents(r,angular.copy(d));s.set(a);i.set([r]);t.$broadcast("feature.filtering.started",r,a)};e.close=function(r){e.feature=false;if(typeof p!=="undefined")i.set(p);if(typeof d!=="undefined")s.set(d);if(r!==false)u.fitMarkerLayer();f=false;t.$broadcast("feature.filtering.closed")};e.$on("layerObjectChange",function(e,t){l(true)});e.$on("closedFeature",function(){l(true)});var m=function(){if(o.featureId&&e.features){var t=e.features.filter(function(e){return e._id==o.featureId})[0];if(t){e.view(t);return true}}return false};t.$on("$stateChangeSuccess",function(){if(!m()&&f){e.close()}});if(n.path().indexOf("edit")!==-1){e.$on("markerClicked",function(t,r){e.edit(r._id)});e.new=function(){i.edit({})};e.edit=function(t){i.edit(angular.copy(e.features.filter(function(e){return e._id==t})[0]));setTimeout(function(){window.dispatchEvent(new Event("resize"))},100)}}}]},{"./featureToMapObjService":21}],20:[function(e,t,r){"use strict";var a=e("./featureToMapObjService");r.FeatureEditCtrl=["$scope","$rootScope","Feature","Layer","MessageService","GeocodeService","MapService",function(e,t,r,o,n,i,s){var u;e.$layer=o;e.$watch("$layer.edit()",function(e){u=e;var t=s.get();if(t)t.on("click",c)});e.$feature=r;e.$watch("$feature.get()",function(t){e.features=t});e.$watch("$feature.edit()",function(r){e.tool=false;e.marker=false;e._data={};e.editing=r;e.setMarker();t.$broadcast("editFeature")});e._data={};e.marker=false;e.defaults={scrollWheelZoom:false};var c=function(t){var t=t.latlng;if(!e.marker){e.editing.geometry={coordinates:[t.lat,t.lng]};e.setMarker(false)}};e.setMarker=function(t){if(e.editing){s.clearMarkers();if(e.editing.geometry){e.marker=a(e.editing,{draggable:true});e.marker.bindPopup('<p class="tip">Arraste para alterar a localização.</p>').on("dragstart",function(){e.marker.closePopup()}).on("drag",function(){e.marker.closePopup();var t=e.marker.getLatLng();e.editing.geometry.coordinates=[t.lat,t.lng]});s.addMarker(e.marker);e.marker.openPopup();if(t!==false){var r=s.get();r.setView(e.marker.getLatLng(),15,{reset:true})}}else{s.fitWorld()}setTimeout(function(){window.dispatchEvent(new Event("resize"))},200)}};e.save=function(t){if(e.editing&&e.editing._id){r.resource.update({featureId:e.editing._id,layerId:u._id},e.editing,function(a){angular.forEach(e.features,function(t,r){if(t._id==e.editing._id)e.features[r]=e.editing});r.set(e.features);r.edit(angular.copy(e.editing));if(t!==true){n.message({status:"ok",text:"Feature salva."});e.close()}},function(e){if(e.status==500)n.message({status:"error",text:"Ocorreu um erro interno. Tente novamente ou entre em contato com nossa equipe"},false)})}else{var a=new r.resource(e.editing);a.$save({layerId:u._id},function(t){e.features.push(t);r.set(e.features);r.edit(angular.copy(t));n.message({status:"ok",text:"Feature adicionada."})},function(e){var t={status:"error"};if(e.status==400&&e.data.message){t.text=e.data.message}else{t.text="Ocorreu um erro interno."}n.message(t,false)})}};e.delete=function(){if(confirm("Você tem certeza que deseja remover esta feature?")){r.resource.delete({featureId:e.editing._id,layerId:u._id},function(){r.set(e.features.filter(function(t){return t._id!==e.editing._id}));r.edit(false);n.message({status:"ok",text:"Feature removida."})},function(e){var t={status:"error"};if(e.status==400&&e.data.message){t.text=e.data.message}else{t.text="Ocorreu um erro interno."}n.message(t,false)})}};e.tool=false;e.setTool=function(t){if(t==e.tool)e.tool=false;else e.tool=t};e.geocode=function(){i.get(e._data.geocode).success(function(t){e._data.geocodeResults=t}).error(function(t){e._data.geocodeResults=[]})};e.setNominatimFeature=function(t){e.editing.geometry={};e.editing.geometry.coordinates=[parseFloat(t.lat),parseFloat(t.lon)];e.setMarker()};e.close=function(){e.tool=false;e.marker=false;e._data={};r.edit(false);t.$broadcast("closedFeature")};e.$on("layerObjectChange",e.close);e.$on("$stateChangeStart",e.close);e.$on("layer.saved.success",function(){if(e.editing){e.save(true)}})}]},{"./featureToMapObjService":21}],21:[function(e,t,r){"use strict";t.exports=function(e,t){if(e.geometry&&e.geometry.coordinates){if(!e.properties){e.properties={}}e.properties=angular.extend({"marker-size":"medium","marker-color":"#444",stroke:"#333","stroke-width":2,fill:"#444"},e.properties);var t=angular.extend({icon:L.mapbox.marker.icon(e.properties)},t);return L.marker(e.geometry.coordinates,t)}return false}},{}],22:[function(e,t,r){"use strict";r.Feature=["$resource","apiPrefix",function(e,t){var r=[],a=false,o=false;return{resource:e(t+"/features/:featureId",{},{save:{method:"POST",url:t+"/layers/:layerId/features"},"delete":{method:"DELETE",url:t+"/layers/:layerId/features/:featureId"},update:{method:"PUT"}}),set:function(e){r=e},add:function(e){r.push(e)},get:function(){return r},edit:function(e){if(typeof e!=="undefined")o=e;return o},getContents:function(e,t){if(e.contents.length){if(t&&t.length){var r=t.filter(function(t){return e.contents.indexOf(t._id)!==-1});return r}}return false}}}]},{}],23:[function(e,t,r){"use strict";r.LayerActionsCtrl=["$rootScope","$scope","$q","$location","MessageService","SessionService","Layer","LayerShare",function(e,t,r,a,o,n,i,s){t.getUrl=function(e){var t=window.location.protocol+"//"+window.location.host+"/layers/"+e._id;return t};t.canEdit=function(e){if(!e||!n.user)return false;if(typeof e.creator=="string"&&e.creator==n.user._id){return true}else if(typeof e.creator=="object"&&e.creator._id==n.user._id){return true}return false};t.edit=function(e){a.path("/layers/"+e._id+"/edit")};t.save=function(t){t.isDraft=false;var a=r.defer();i.resource.update({layerId:t._id},t,function(t){o.message({status:"ok",text:"Camada atualizada"});e.$broadcast("layer.save.success",t);a.resolve(t)},function(t){o.message({status:"error",text:"Ocorreu um erro."});e.$broadcast("layer.save.error",t);a.resolve(t)});return a.promise};t.delete=function(t,r){if(confirm("Você tem certeza que deseja remover esta camada?")){i.resource.delete({layerId:t._id},function(r){o.message({status:"ok",text:"Camada removida."});e.$broadcast("layer.delete.success",t)},function(t){o.message({status:"error",text:"Ocorreu um erro."});e.$broadcast("layer.delete.error",t)})}};t.share=function(e){s.activate({layer:e,social:{facebook:"http://facebook.com/share.php?u="+t.getUrl(e),twitter:"http://twitter.com/share?url="+t.getUrl(e)},socialWindow:function(e,t){window.open(e,t,"width=550,height=300,resizable=1")},close:function(){s.deactivate()}});t.$on("$destroy",function(){s.deactivate()})};t.templates={list:"/views/layer/list-item.html"}}]},{}],24:[function(e,t,r){"use strict";e("../common/geocode");angular.module("mapasColetivos.layer",["ngResource","btford.modal","mapasColetivos.geocode","mapasColetivos.feature","mapasColetivos.content"]).config(["$stateProvider",function(e){e.state("dashboard.layers",{url:"/layers",templateUrl:"/views/dashboard/layers.html"}).state("layers",{url:"/layers",controller:"LayerCtrl",templateUrl:"/views/layer/index.html"}).state("newLayer",{url:"/layers/new",controller:"LayerCtrl",templateUrl:"/views/layer/index.html"}).state("singleLayer",{url:"/layers/:layerId",controller:"LayerCtrl",templateUrl:"/views/layer/show.html"}).state("singleLayer.content",{url:"/content/:contentId"}).state("singleLayer.feature",{url:"/feature/:featureId"}).state("editLayer",{url:"/layers/:layerId/edit",controller:"LayerCtrl",templateUrl:"/views/layer/edit.html"})}]).factory("Layer",e("./service.js").Layer).factory("LayerShare",e("./share").shareService).controller("LayerActionsCtrl",e("./actions").LayerActionsCtrl).controller("LayerCtrl",e("./controller").LayerCtrl)},{"../common/geocode":3,"./actions":23,"./controller":25,"./service.js":26,"./share":27}],25:[function(e,t,r){"use strict";r.LayerCtrl=["$scope","$rootScope","$location","$state","$stateParams","$q","Page","Layer","Feature","Content","MessageService","SessionService","MapService",function(e,t,r,a,o,n,i,s,u,c,l,f,d){if(r.path()=="/layers/new"){var p=new s.resource({title:"Untitled"});p.$save(function(e){r.path("/layers/"+e._id+"/edit").replace()},function(e){})}else if(o.layerId){e.activeObj="settings";e.layerObj=function(t){if(e.activeObj==t)return"active";return false};e.setLayerObj=function(t){e.activeObj=t;setTimeout(function(){window.dispatchEvent(new Event("resize"))},100)};e.$watch("activeObj",function(t){u.edit(false);c.edit(false);e.$broadcast("layerObjectChange",t)});e.$on("layer.delete.success",function(){r.path("/dashboard/layers").replace()});s.resource.get({layerId:o.layerId},function(o){e.layer=o;i.setTitle(o.title);var n=d.init("layer-map",{center:[0,0],zoom:2});e.fitMarkerLayer=function(){d.fitMarkerLayer()};u.set(o.features);c.set(o.contents);t.$broadcast("data.ready",o);if(r.path().indexOf("edit")!==-1){s.edit(o);if(e.layer.title=="Untitled"){e.layer.title="";i.setTitle("Nova camada")}e.$on("layer.save.success",function(t,r){i.setTitle(r.title);e.layer=r});e.close=function(){if(s.isDraft(o)){r.path("/dashboard/layers").replace()}else{r.path("/layers/"+o._id)}};e.$on("$stateChangeStart",function(){s.deleteDraft(o)})}else{e.$on("markerClicked",function(e,t){a.go("singleLayer.feature",{featureId:t._id})})}},function(){r.path("/layers").replace();l.message({status:"error",text:"Esta camada não existe"})});e.$on("$destroy",function(){d.destroy()})}else{i.setTitle("Camadas");s.resource.query(function(t){e.layers=t.layers})}}]},{}],26:[function(e,t,r){"use strict";r.Layer=["$resource","apiPrefix",function(e,t){var r=false;return{resource:e(t+"/layers/:layerId",{},{query:{isArray:false,method:"GET"},update:{method:"PUT"}}),edit:function(e){if(typeof e!=="undefined")r=e;return r},isDraft:function(e){return e.isDraft},deleteDraft:function(e,t){if(this.isDraft(e)){this.resource.delete({layerId:e._id},t)}}}}]},{}],27:[function(e,t,r){"use strict";r.shareService=["btfModal",function(e){return e({controller:"LayerActionsCtrl",controllerAs:"share",templateUrl:"/views/layer/share.html"})}]},{}],28:[function(e,t,r){"use strict";r.MapActionsCtrl=["$rootScope","$scope","$q","$location","MessageService","SessionService","Map","MapShare",function(e,t,r,a,o,n,i,s){t.getUrl=function(e){var t=window.location.protocol+"//"+window.location.host+"/maps/"+e._id;return t};t.canEdit=function(e){if(!e||!n.user)return false;if(typeof e.creator=="string"&&e.creator==n.user._id){return true}else if(typeof e.creator=="object"&&e.creator._id==n.user._id){return true}return false};t.edit=function(e){a.path("/maps/"+e._id+"/edit")};t.save=function(t){t.isDraft=false;var a=r.defer();i.resource.update({mapId:t._id},t,function(t){o.message({status:"ok",text:"Mapa atualizado"});e.$broadcast("map.save.success",t);a.resolve(t)},function(t){o.message({status:"error",text:"Ocorreu um erro."});e.$broadcast("map.save.error",t);a.resolve(t)});return a.promise};t.delete=function(t,r){if(confirm("Você tem certeza que deseja remover este mapa?")){i.resource.delete({mapId:t._id},function(r){o.message({status:"ok",text:"Mapa removido."});e.$broadcast("map.delete.success",t)},function(t){o.message({status:"error",text:"Ocorreu um erro."});e.$broadcast("map.delete.error",t)})}};t.share=function(e){s.activate({map:e,social:{facebook:"http://facebook.com/share.php?u="+t.getUrl(e),twitter:"http://twitter.com/share?url="+t.getUrl(e)},socialWindow:function(e,t){window.open(e,t,"width=550,height=300,resizable=1")},close:function(){s.deactivate()}});t.$on("$destroy",function(){s.deactivate()})};t.templates={list:"/views/map/list-item.html"}}]},{}],29:[function(e,t,r){"use strict";angular.module("mapasColetivos.map",["btford.modal","ui.sortable","mapasColetivos.leaflet","mapasColetivos.layer"]).config(["$stateProvider",function(e){e.state("dashboard.maps",{url:"/maps",templateUrl:"/views/dashboard/maps.html"}).state("maps",{url:"/maps",controller:"MapCtrl",templateUrl:"/views/map/index.html"}).state("newMap",{url:"/maps/new",controller:"MapCtrl",templateUrl:"/views/map/index.html"}).state("singleMap",{url:"/maps/:mapId",controller:"MapCtrl",templateUrl:"/views/map/show.html"}).state("singleMap.content",{url:"/content/:contentId"}).state("singleMap.feature",{url:"/feature/:featureId"}).state("editMap",{url:"/maps/:mapId/edit",controller:"MapCtrl",templateUrl:"/views/map/edit.html"})}]).factory("Map",e("./service").Map).factory("MapShare",e("./share").shareService).controller("MapCtrl",e("./controller").MapCtrl).controller("MapActionsCtrl",e("./actions").MapActionsCtrl)},{"./actions":28,"./controller":30,"./service":31,"./share":32}],30:[function(e,t,r){"use strict";r.MapCtrl=["$scope","$rootScope","$location","$state","$stateParams","Page","Map","Layer","Content","Feature","MapService","MessageService","SessionService",function(e,t,r,a,o,n,i,s,u,c,l,f,d){e.user=d.user;if(r.path()=="/maps/new"){var p=new i.resource({title:"Untitled"});p.$save(function(e){r.path("/maps/"+e._id+"/edit").replace()},function(e){})}else if(o.mapId){var m=l.init("map",{center:[0,0],zoom:2});e.activeObj="settings";e.mapObj=function(t){if(e.activeObj==t)return"active";return false};e.setMapObj=function(t){e.activeObj=t;setTimeout(function(){window.dispatchEvent(new Event("resize"))},100)};e.isEditing=function(){return r.path().indexOf("edit")!==-1};i.resource.get({mapId:o.mapId},function(o){n.setTitle(o.title);e.map=angular.copy(o);if(e.isEditing()){s.resource.query({creatorOnly:true},function(t){e.userLayers=t.layers;e.availableLayers=angular.copy(e.userLayers)})}e.layerSearch="";e.$watch("layerSearch",function(t){if(t){s.resource.query({search:t},function(t){if(t.layers){e.availableLayers=t.layers}})}else{e.availableLayers=angular.copy(e.userLayers)}});e.focusLayer=function(e){};e.toggleLayer=function(t){if(!e.map.layers)e.map.layers=[];var r=angular.copy(e.map.layers);if(e.hasLayer(t)){if(e.isEditing()&&confirm("Tem certeza que gostaria de remover esta camada do seu mapa?"))r=r.filter(function(e){return e!==t._id})}else{r.push(t._id)}e.map.layers=r};e.hasLayer=function(t){if(!e.map.layers)e.map.layers=[];return e.map.layers.filter(function(e){return e==t._id}).length};var f={};var d=function(t){var o=l.addLayer(t);t._mcData=o;angular.forEach(o.markers,function(e){e.on("click",function(){if(r.path().indexOf("edit")==-1){a.go("singleMap.feature",{featureId:e.mcFeature._id})}else{}}).on("mouseover",function(){e.openPopup()}).on("mouseout",function(){e.closePopup()}).bindPopup('<h3 class="feature-title">'+e.mcFeature.title+"</h3>")});e.layers.push(t);if(e.layers.length===e.map.layers.length){e.setupMapContent();e.fixLayerOrdering()}};e.fixLayerOrdering=function(){var t=[];angular.forEach(e.map.layers,function(r){t.push(e.layers.filter(function(e){return e._id==r})[0])});e.layers=t};e.hideAllLayers=function(){angular.forEach(e.layers,function(t){e.hideLayer(t._mcData.markerLayer)})};e.hideLayer=function(e){l.get().removeLayer(e)};e.showAllLayers=function(){angular.forEach(e.layers,function(t){e.showLayer(t._mcData.markerLayer)})};e.showLayer=function(e){l.get().addLayer(e)};e.setupMapContent=function(){var r=[];var a=[];angular.forEach(e.layers,function(e){angular.forEach(e.features,function(e){a.push(e)});angular.forEach(e.contents,function(e){r.push(e)})});u.set(r);c.set(a);t.$broadcast("data.ready",e.map);e.$on("content.filtering.started",e.hideAllLayers);e.$on("feature.filtering.started",e.hideAllLayers);e.$on("content.filtering.closed",e.showAllLayers);e.$on("feature.filtering.closed",e.showAllLayers)};e.$watch("map.layers",function(t){l.clearAll();e.layers=[];angular.forEach(t,function(e){var t,r;if(f[e]){t=f[e];d(t)}else{s.resource.get({layerId:e},function(e){e=f[e._id]=e;d(e)})}})});e.sortLayer={stop:function(){var t=[];angular.forEach(e.layers,function(e){t.push(e._id)});e.map.layers=t}};e.$on("map.save.success",function(t,r){n.setTitle(r.title);e.map=r});e.$on("map.delete.success",function(){r.path("/dashboard/maps").replace()});e.$on("$stateChangeStart",function(){i.deleteDraft(e.map)});e.close=function(){if(i.isDraft(e.map)){r.path("/dashboard/maps")}else{r.path("/maps/"+e.map._id)}};if(r.path().indexOf("edit")!==-1){if(e.map.title=="Untitled"){e.map.title="";n.setTitle("Novo mapa")}}e.$on("markerClicked",function(e,t){a.go("singleMap.feature",{featureId:t._id})
})})}else{n.setTitle("Mapas");i.resource.query(function(t){e.maps=t.maps})}}]},{}],31:[function(e,t,r){"use strict";r.Map=["$resource","apiPrefix",function(e,t){return{resource:e(t+"/maps/:mapId",{},{query:{isArray:false,method:"GET"},update:{method:"PUT"}}),isDraft:function(e){return e.isDraft},deleteDraft:function(e,t){if(this.isDraft(e)){this.resource.delete({mapId:e._id},t)}}}}]},{}],32:[function(e,t,r){"use strict";r.shareService=["btfModal",function(e){return e({controller:"MapActionsCtrl",controllerAs:"share",templateUrl:"/views/map/share.html"})}]},{}],33:[function(e,t,r){"use strict";angular.module("mapasColetivos.user",[]).factory("User",e("./service").User).controller("UserCtrl",e("./controller").UserCtrl)},{"./controller":34,"./service":35}],34:[function(e,t,r){"use strict";r.UserCtrl=["$scope","$rootScope","User","MessageService",function(e,t,r,a){e.save=function(e){r.resource.update({userId:e._id},e,function(e){a.message({status:"ok",text:"Usuário atualizado."});t.$broadcast("user.save.success",e)},function(e){a.message({status:"error",text:"Ocorreu um erro."});t.$broadcast("user.save.error",e)})}}]},{}],35:[function(e,t,r){"use strict";r.User=["$resource","apiPrefix",function(e,t){return{resource:e(t+"/users",{},{update:{method:"PUT"}})}}]},{}],36:[function(e,t,r){angular.module("monospaced.elastic",[]).constant("msdElasticConfig",{append:""}).directive("msdElastic",["$timeout","$window","msdElasticConfig",function(e,t,r){"use strict";return{require:"ngModel",restrict:"A, C",link:function(a,o,n,i){var s=o[0],u=o;if(s.nodeName!=="TEXTAREA"||!t.getComputedStyle){return}u.css({overflow:"hidden","overflow-y":"hidden","word-wrap":"break-word"});var c=s.value;s.value="";s.value=c;var l=n.msdElastic||r.append,f=l==="\\n"?"\n":l,d=angular.element(t),p="position: absolute; top: -999px; right: auto; bottom: auto; left: 0 ;"+"overflow: hidden; -webkit-box-sizing: content-box;"+"-moz-box-sizing: content-box; box-sizing: content-box;"+"min-height: 0 !important; height: 0 !important; padding: 0;"+"word-wrap: break-word; border: 0;",m=angular.element('<textarea tabindex="-1" '+'style="'+p+'"/>').data("elastic",true),g=m[0],v=getComputedStyle(s),y=v.getPropertyValue("resize"),h=v.getPropertyValue("box-sizing")==="border-box"||v.getPropertyValue("-moz-box-sizing")==="border-box"||v.getPropertyValue("-webkit-box-sizing")==="border-box",$=!h?{width:0,height:0}:{width:parseInt(v.getPropertyValue("border-right-width"),10)+parseInt(v.getPropertyValue("padding-right"),10)+parseInt(v.getPropertyValue("padding-left"),10)+parseInt(v.getPropertyValue("border-left-width"),10),height:parseInt(v.getPropertyValue("border-top-width"),10)+parseInt(v.getPropertyValue("padding-top"),10)+parseInt(v.getPropertyValue("padding-bottom"),10)+parseInt(v.getPropertyValue("border-bottom-width"),10)},w=parseInt(v.getPropertyValue("min-height"),10),b=parseInt(v.getPropertyValue("height"),10),C=Math.max(w,b)-$.height,x=parseInt(v.getPropertyValue("max-height"),10),k,L,S=["font-family","font-size","font-weight","font-style","letter-spacing","line-height","text-transform","word-spacing","text-indent"];if(u.data("elastic")){return}x=x&&x>0?x:9e4;if(g.parentNode!==document.body){angular.element(document.body).append(g)}u.css({resize:y==="none"||y==="vertical"?"none":"horizontal"}).data("elastic",true);function M(){k=s;v=getComputedStyle(s);angular.forEach(S,function(e){p+=e+":"+v.getPropertyValue(e)+";"});g.setAttribute("style",p)}function _(){var t,r,o,n;if(k!==s){M()}if(!L){L=true;g.value=s.value+f;g.style.overflowY=s.style.overflowY;t=s.style.height===""?"auto":parseInt(s.style.height,10);o=parseInt(getComputedStyle(s).getPropertyValue("width"),10)-$.width;g.style.width=o+"px";r=g.scrollHeight;if(r>x){r=x;n="scroll"}else if(r<C){r=C}r+=$.height;s.style.overflowY=n||"hidden";if(t!==r){s.style.height=r+"px";a.$emit("elastic:resize",u)}e(function(){L=false},1)}}function T(){L=false;_()}if("onpropertychange"in s&&"oninput"in s){s["oninput"]=s.onkeyup=_}else{s["oninput"]=_}d.bind("resize",T);a.$watch(function(){return i.$modelValue},function(e){T()});e(_);a.$on("$destroy",function(){m.remove();d.unbind("resize",T)})}}}])},{}]},{},[1]);