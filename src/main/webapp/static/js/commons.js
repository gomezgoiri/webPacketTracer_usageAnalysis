

var queryParameter = (function () {
    function getParameter(name) {
    var lookFor = name + '=';
    var sessionParamStart = window.location.href.indexOf(lookFor);
    var ret = null;
    if (sessionParamStart!=-1) {
        var ret = window.location.href.substr(sessionParamStart + lookFor.length);
        var endSessionParam = ret.indexOf('&');
        if (endSessionParam!=-1) {
            ret = ret.substr(0, endSessionParam);
        }
    }
    return ret;
    }

    function getAllParameters() {
      var paramPos = window.location.href.indexOf('?');
      if (paramPos==-1) return null;
      return window.location.href.substr(paramPos + 1);
    }

    return {
      get: getParameter,
      all: getAllParameters
    };
})();


var errorDialog = (function () {
  function init(message) {
      $('#errorDialog div.modal-body p').text(message);
      $('#errorDialog').modal('show')
      console.error(message);
  }
  return {
      open: init
  };
})();


var timeFilter = (function () {

    var displayDateFormat = 'MM/DD/YYYY HH:00';
    var startEl, endEl;

    function getEndDate() {
        return endEl.data("DateTimePicker").date();
    }

    function setStartDate(timeMoment) {
        startEl.data("DateTimePicker").date(timeMoment);
    }

    function setEndDate(timeMoment) {
        endEl.data("DateTimePicker").date(timeMoment);
    }

    function setMinEndDate(timeMoment) {
        var minMoment = timeMoment.add(1, 'hours');

        endEl.data("DateTimePicker").minDate(minMoment);
        if (getEndDate() < minMoment) {
            setEndDate(minMoment);
        }
    }

    function configure(startId, endId) {
        startEl = $('#' + startId);
        endEl = $('#' + endId);

        startEl.datetimepicker({
            format: displayDateFormat,
            useCurrent: false,
            defaultDate: moment().startOf('day'),
        });

        endEl.datetimepicker({
            format: displayDateFormat,
            useCurrent: false,
            defaultDate: moment().endOf('day'),
        });

        startEl.on('dp.change', function(e) {
            setMinEndDate(e.date);
        });
    }

    function getURLParams() {
        var startISO = $('#startTime').data("DateTimePicker").date().toISOString();
        var endISO = $('#endTime').data("DateTimePicker").date().toISOString();
        return 'start=' + startISO +'&end=' + endISO;
    }

    return {
        configure: configure,
        setStartDate: setStartDate,
        setEndDate: setEndDate,
        getURLParameters: getURLParams,
    };
})();


var statements = (function () {
    function createListener() {
        return new Listener();
    }

    function Listener() {
        this.callbacks = {
            deviceCreation: null,
            deviceRemoval: null,
            deviceUpdate: null,
            linkCreation: null,
            linkRemoval: null,
            openCmd: null,
            closeCmd: null,
            useCmd: null,
            readCmd: null
        };
    }

    Listener.prototype.onCreateDevice = function(creationCallback) {
        this.callbacks.deviceCreation = creationCallback;
        return this;
    }

    Listener.prototype.onDeleteDevice = function(removalCallback) {
        this.callbacks.deviceRemoval = removalCallback;
        return this;
    }

    Listener.prototype.onUpdateDevice = function(updateCallback) {
        this.callbacks.deviceUpdate = updateCallback;
        return this;
    }

    Listener.prototype.onUpdatePort = function(updateCallback) {
        this.callbacks.portUpdate = updateCallback;
        return this;
    }

    Listener.prototype.onCreateLink = function(creationCallback) {
        this.callbacks.linkCreation = creationCallback;
        return this;
    }

    Listener.prototype.onDeleteLink = function(removalCallback) {
        this.callbacks.linkRemoval = removalCallback;
        return this;
    }

    Listener.prototype.onOpenCommandLine = function(openCallback) {
        this.callbacks.openCmd = openCallback;
        return this;
    }

    Listener.prototype.onCloseCommandLine = function(closeCallback) {
        this.callbacks.closeCmd = closeCallback;
        return this;
    }

    Listener.prototype.onUseCommandLine = function(useCallback) {
        this.callbacks.useCmd = useCallback;
        return this;
    }

    Listener.prototype.onReadCommandLine = function(readCallback) {
        this.callbacks.readCmd = readCallback;
        return this;
    }

    Listener.prototype.onStatement = function(statement) {
        var dext = (statement.result===undefined)? null: statement.result.extensions;
        if (statement.verb.id===verb.create) {
            if (statement.object.id.startsWith(devices.any)) {
                if (this.callbacks.deviceCreation==null) {
                    console.warn('No callback function defined for device creation.');
                } else {
                    this.callbacks.deviceCreation(dext);
                }
            } else if (statement.object.id == activity.link) {
                if (this.callbacks.linkCreation==null) {
                    console.warn('No callback function defined for link creation.');
                } else {
                    this.callbacks.linkCreation(dext);
                }
            }
        } else if (statement.verb.id===verb.delete) {
            if (statement.object.id.startsWith(devices.any)) {
                if (this.callbacks.deviceRemoval==null) {
                    console.warn('No callback function defined for device removal.');
                } else {
                    this.callbacks.deviceRemoval(dext);
                }
            } else if (statement.object.id == activity.link) {
                if (this.callbacks.linkRemoval==null) {
                    console.warn('No callback function defined for link removal.');
                } else {
                    this.callbacks.linkRemoval(dext);
                }
            }
        } else if (statement.verb.id===verb.update) {
            if (statement.object.id.startsWith(devices.any)) {
                if (this.callbacks.deviceUpdate==null) {
                    console.warn('No callback function defined for device update.');
                } else {
                    this.callbacks.deviceUpdate(dext, statement.result.response);
                }
            } else if (statement.object.definition.type==activity.port) {
                if (this.callbacks.portUpdate==null) {
                    console.warn('No callback function defined for device port update.');
                } else {
                    this.callbacks.portUpdate(dext);
                }
            }
        } else if (statement.verb.id===verb.opened) {
            if (statement.object.definition.type==activity.commandLine) {
                if (this.callbacks.openCmd==null) {
                    console.warn('No callback function defined for command line open.');
                } else {
                    // It would be better to store the name as an extension too.
                    this.callbacks.openCmd(statement.object.definition.name['en-GB']);
                }
            }
        } else if (statement.verb.id===verb.closed) {
            if (statement.object.definition.type==activity.commandLine) {
                if (this.callbacks.closeCmd==null) {
                    console.warn('No callback function defined for command line close.');
                } else {
                    this.callbacks.closeCmd();
                }
            }
        } else if (statement.verb.id===verb.use) {
            if (statement.object.definition.type==activity.commandLine) {
                if (this.callbacks.useCmd==null) {
                    console.warn('No callback function defined for command line use.');
                } else {
                    this.callbacks.useCmd(dext);
                }
            }
        } else if (statement.verb.id===verb.read) {
            if (statement.object.definition.type==activity.commandLine) {
                if (this.callbacks.readCmd==null) {
                    console.warn('No callback function defined for command line read.');
                } else {
                    this.callbacks.readCmd(statement.result.response);
                }
            }
        }
    }

    return {
        newListener: createListener
    };
})();