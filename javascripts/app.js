$(function() {

  "use strict";

  // debug window
  require('nw.gui').Window.get().showDevTools();

  // include node standard libraries
  var fs = require("fs");

  // include node npm packages
  var promise = require('bluebird');

  // add async/promise
  promise.promisifyAll(fs);

  //////////////////////////////////////////////////

  var run_cmd = function(cmd, args) {
    return new promise(function(resolve,reject){
      var spawn = require('child_process').spawn;
      var child = spawn(cmd, args);
      var resp = "";

      child.stdout.on('data', function (buffer) { resp += buffer.toString() });
      child.stdout.on('end', function() { resolve (resp) });
    });
  }

  var services = [];

  promise.bind(services)
    .then(function(){
      return fs.readFileAsync('config/service_config.json', 'utf8');
    })
    .then(JSON.parse)
    .then(function(parsed){
      this.push.apply(this, parsed);
    })
    .then(function(){
      return fs.readFileAsync('templates/services.hbs', 'utf8');
    })
    .then(function(template_source){
      var template = Handlebars.compile(template_source);
      $('[data-service-container]').append(template( { services: this } ));
      return this;
    })
    .each(function(service) {

      return run_cmd("ps", ["aux"]).then(function(output){

        var output_lines = output.split(/\r?\n/);
        var filtered = output_lines.filter(function(x){
          var regex = new RegExp(service.ps_search, 'i');
          return regex.test(x);
        });

        // update data
        service.is_running = filtered.length > 0 ? true : false;

      });

    })
    .each(function(service){

      var $service_name_td = $('[data-service-container] [data-service-name="' + service.name + '"]');
      var $service_status_td = $service_name_td.parent('tr').find('[data-service-status]');

      $('span.label-default', $service_status_td).hide();

      // show status span
      if (service.is_running) {
        $('span.label-success', $service_status_td).removeClass('hidden').show();
      }
      else {
        $('span.label-danger', $service_status_td).removeClass('hidden').show();
      }

    })
    .then(function(){

      // debug
      //console.log(this);

    })
    .catch(function(e) {
      //console.error("ERROR: ", JSON.stringify(e));
      console.error("ERROR: ", e);
    });

});
