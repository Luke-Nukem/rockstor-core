/*
 *
 * @licstart  The following is the entire license notice for the
 * JavaScript code in this page.
 *
 * Copyright (c) 2012-2013 RockStor, Inc. <http://rockstor.com>
 * This file is part of RockStor.
 *
 * RockStor is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published
 * by the Free Software Foundation; either version 2 of the License,
 * or (at your option) any later version.
 *
 * RockStor is distributed in the hope that it will be useful, but
 * WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU
 * General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program. If not, see <http://www.gnu.org/licenses/>.
 *
 * @licend  The above is the entire license notice
 * for the JavaScript code in this page.
 *
 */

SmartcustomDiskView = RockstorLayoutView.extend({
  events: {
    'click #cancel': 'cancel'
  },

  initialize: function() {
    this.constructor.__super__.initialize.apply(this, arguments);
    this.template = window.JST.disk_smartcustom_disks;
    this.disks = new DiskCollection();
    this.diskName = this.options.diskName;
    this.dependencies.push(this.disks);
  },

 render: function() {
    this.fetch(this.renderDisksForm, this);
    return this;
  },

  renderDisksForm: function() {
    if (this.$('[rel=tooltip]')) {
      this.$("[rel=tooltip]").tooltip('hide');
    }
    var _this = this;
    var disk_name = this.diskName;
    var serialNumber = this.disks.find(function(d){ return (d.get('name') == disk_name);}).get('serial');
    var currentSmartCustom = this.disks.find(function(d){ return (d.get('name') == disk_name);}).get('smart_options');

    $(this.el).html(this.template({
	diskName: this.diskName,
	serialNumber: serialNumber,
    currentSmartCustom: currentSmartCustom
    }));

    this.$('#add-smartcustom-disk-form :input').tooltip({
      html: true,
      placement: 'right'
    });

    var err_msg = '';
      var smartcustom_err_msg = function() {
          return err_msg;
      }

    $.validator.addMethod('validateSmartCustom', function(value) {
        var smartcustom_options = $('#smartcustom_options').val();
        var devOptions = ["auto", "test", "ata", "scsi", "sat", "sat,12", "sat,16", "sat,auto", "usbprolific", "usbjmicron", "usbjmicron,0", "usbjmicron,p", "usbjmicron,x", "usbjmicron,x,1", "usbcypress", "usbsunplus"];
        var devOptionsRaid = ["3ware", "areca", "hpt", "cciss", "megaraid", "aacraid"];
        var toleranceOptions = ["normal", "conservative", "permissive", "verypermissive"];
        // Check for invalid characters
        if (/^[A-Za-z0-9,-/ ]+$/.test(smartcustom_options) == false) {
			err_msg = 'Invalid character found, expecting only letters, numbers, and \'-\',\'/\' and \'space.\'';
			return false;
        }
        else
            if((!smartcustom_options.includes("-d ")) && (!smartcustom_options.includes("-T "))){
                err_msg = 'Must contain either -d or -T options or both.';
                return false;
            }
        else
            if(smartcustom_options.length > 64) {
            err_msg = 'S.M.A.R.T options must not exceed 64 characters.';
            return false;
        }
        // By now we have valid characters that include "-d " and or "-T " and
        // less than 64 of them (including spaces) - the max db field length.
        var first_d_option =  smartcustom_options.indexOf("-d ")
        // Check for only one instance of "-d " including ending in "-d", note
        // that multiple instances of -T are valid.
        if (first_d_option != -1 && smartcustom_options.lastIndexOf("-d") != first_d_option) {
            err_msg = 'Only one occurrence of -d is permitted.';
            return false;
        }
        // Reject unknown options ie not "d " or "T " after a -
        // ?

        // Validate each option ie
        // find elements of given options as split by space.
        var option_array = smartcustom_options.split(" ");
        console.log('working with option array = ', option_array)
        console.log('contents of first element = ', option_array[0])
        if ((option_array[0] != "-d") && (option_array[0] != "-T")) {
            err_msg = 'Please begin with either \'-d \' or \'-T \'';
            return false;
        }
        // true if option is Device switch "-d"
        function isDevSwitch(option) {
            return (option == "-d");
        }
        // true if option is Tolerance switch ie "-T"
        function isToleranceSwitch(option) {
            return (option == "-T");
        }
        // true if not recognized as a dev option (non Raid)
        function isNotDevOption(option) {
            return (devOptions.indexOf(option) == -1);
        }
        // true if not recognized as a type option
        function isNotToleranceOption(option) {
            return (toleranceOptions.indexOf(option) == -1);
        }
        // true if not recognized as a RAID option
        // consider improving to use string.match(regexp) to account of numbers
        function isNotRaidOption(option) {
            var without_values = option.substring(0, option.indexOf(","));
            console.log('without_values = ', without_values);
            return (devOptionsRaid.indexOf(without_values) == -1);
        }
        // true if not recognized as a RAID target device
        function isNotRaidTarget(option) {
            // /dev/twe, /dev/twa, /dev/twl followed by 1 or 2 numbers
            if (/\/dev\/tw[e|a|l][0-9]/.test(option) == false) {
                console.log('isNotRaidTarget is returning true on option', option, /\/dev\/tw[e|a|l][0-9]/.test(option));
                console.log('option.toString = ', option.toString());
                return true;
            } else {
                console.log('isNotRaidTarget is returning false on option', option);
                return false;
            }
        }
        // Categorize all entered options individually forEach is order safe.
        var dev_options_found = [];
        var tol_options_found = [];
        var unknown_options_found = [];
        var option_type = '';
        var unknown_switches_found = [];
        option_array.forEach(function(option) {
            console.log('examining option ', option);
            // console.log('isNotDevOption returned ', isNotDevOption(option));
            // console.log('isNotTypeOption returned ', isNotToleranceOption(option));
            // console.log('isNotRiadOption returned ', isNotRaidOption(option));
            // filter our various options before assessing them as valid.
            if (option.charAt(0) == "-") {
                // option is a switch
                if (isDevSwitch(option)) {
                    option_type = "dev";
                } else if (isToleranceSwitch(option)) {
                    option_type = "tol";
                } else { // unknown switch
                    option_type = "unknown";
                    unknown_switches_found.push(option);
                }
            } else if (option_type == "dev") {
                // collect all options proceeded by a -d option
                dev_options_found.push(option);
                console.log('dev_options_found so far = ', dev_options_found);
            } else if (option_type == "tol") {
                // collect all options proceeded by a -T option
                tol_options_found.push(option);
                console.log('tol_options_found so far = ', tol_options_found);
            } else {
                // collect all other options proceeded by an unknown switch.
                unknown_options_found.push(option);
                console.log('unknown_options_found so far = ', unknown_options_found);
            }
        });
        // report any unknown switches
        if (unknown_switches_found != "" ) {
            err_msg = 'One or more unknown switches found: \'' + unknown_switches_found.toString() + '\', supported switches are \'-d\' and \'-T\'';
            return false;
        }
        // report any options of unknown type
        // Note this should never trigger as the last unknown_switches_found
        // should trigger first. We have a later one to catch unknown options
        // after known triggers.
        if (unknown_options_found != "") {
            err_msg = 'The following options of an unknown type were entered:' +
                ' \'' + unknown_options_found.toString() + '\', supported ' +
                'options are ' + devOptions.toString() + '\n' +
                devOptionsRaid.toString() + toleranceOptions.toString();
            return false;
        }
        // Filter out unknown options on known switches ie "-d notanoption"
        // Filter our dev options first by absolute known / allowed options
        // filter the resulting array by the less strict known raid options
        var unknown_dev_options_found = dev_options_found.filter(isNotDevOption).filter(isNotRaidOption).filter(isNotRaidTarget);
        if (unknown_dev_options_found != "") {
            err_msg = 'The following unknown \'-d\' options were found ' + unknown_dev_options_found.toString();
            return false;
        }
        // Filter out unknown Tolerance options
        var unknown_tol_options_found = tol_options_found.filter(isNotToleranceOption);
        if (unknown_tol_options_found != "") {
            err_msg = 'The following unknown \'-T\' options were found \'' +
                unknown_tol_options_found.toString() + '\'. Available options' +
                ' are ' + toleranceOptions.toString();
            return false;
        }
        // Finally check if more than one -d option is given
        if (dev_options_found.length > 1) {
            // only legitimate -d option with 2 parameters is raid + raid target
            if (dev_options_found.length == 2) {
                if ((!isNotRaidOption(dev_options_found[0])) && (!isNotRaidTarget(dev_options_found[1]))) {
                    // we have a raid option followed by a raid target dev
                    console.log('found a raid option with a raid target')
                    return true
                }
            }
            err_msg = 'Only one \'-d\' option is supported';
            return false;
        }


        return true;
    }, smartcustom_err_msg);

    this.$('#add-smartcustom-disk-form').validate({
      onfocusout: false,
      onkeyup: false,
      rules: {
	  smartcustom_options: 'validateSmartCustom',
      },

      submitHandler: function() {
	    var button = $('#smartcustom-disk');
        if (buttonDisabled(button)) return false;
        disableButton(button);
        var submitmethod = 'POST';
        var posturl = '/api/disks/' + disk_name + '/smartcustom-drive';
        $.ajax({
          url: posturl,
          type: submitmethod,
          dataType: 'json',
          contentType: 'application/json',
          data: JSON.stringify(_this.$('#add-smartcustom-disk-form').getJSON()),
          success: function() {
           enableButton(button);
            _this.$('#add-smartcustom-disk-form :input').tooltip('hide');
            app_router.navigate('disks', {trigger: true});
          },
          error: function(xhr, status, error) {
            enableButton(button);
          }
        });

        return false;
      }
    });
  },

  cancel: function(event) {
    event.preventDefault();
    this.$('#add-smartcustom-disk-form :input').tooltip('hide');
    app_router.navigate('disks', {trigger: true});
  }

});
