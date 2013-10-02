/*
* jQuery nicecomplete
* https://github.com/carlosrberto/jquery-nicecomplete
*
* Copyright (c) 2013 Carlos Roberto Gomes Junior
* http://carlosroberto.name/
*
* Licensed under a Creative Commons Attribution 3.0 License
* http://creativecommons.org/licenses/by-sa/3.0/
*
* Version: 0.1
*/

(function() {
    var defaults = {
        searchDelay: 500,
        url: function(p) {
            return '/search/?q=' + p;
        }
    };

    var NiceComplete = function(el, options) {
        this.el = $(el);
        this.lastText = null;
        this.options = $.extend({}, defaults, options);
        this.delayInProgress = false;
        this.searchInterval = null;
        this.cache = {};

        if (!this.options.url) {
            throw new Error('You must specify the service url using options.url');
        }

        this._initEvens();
    };

    NiceComplete.prototype = {
        setOptions: function( options ) {
            this.options = $.extend({}, this.options, options);
        },

        _initEvens: function() {
            this.el.on('keyup', $.proxy(this._keyupHandler, this));
        },

        _keyupHandler: function(event) {
            if ( !this.delayInProgress ) {
                this._searchTimer(this.el.val());
            }
        },

        _searchTimer: function(text) {
            var that = this;
            this.delayInProgress = true;
            this.searchInterval = setTimeout(function() {
                if (that.lastText !== text) {
                    that.lastText = text;
                    that.search(text).done(function() {
                        clearTimeout(that.searchInterval);
                        that.delayInProgress = false;
                        if ( text !== that.el.val()) {
                            that._searchTimer(that.el.val());
                        }
                    });
                } else {
                    clearTimeout(that.searchInterval);
                    that.delayInProgress = false;
                }
            }, this.options.searchDelay);
        },

        search: function(text) {
            this.el.trigger('beforeload.nicecomplete');
            return this._searchRequest(text).done(function(data) {
                this.el.trigger('load.nicecomplete', [data]);
            }).fail(function() {
                this.el.trigger('loaderror.nicecomplete', arguments);
            });
        },

        _searchRequest: function( text ) {
            var deferred = new $.Deferred();
            var cache = this.cache[text];

            if ( cache ) {
                deferred.resolveWith(this, [cache]);
            } else {
                $.ajax({
                    context: this,
                    url: this.options.url(text)
                }).done(function(data) {
                    this.cache[text] = data;
                    deferred.resolveWith(this, [data]);
                }).fail(function() {
                    deferred.rejectWith(this, arguments);
                });
            }

            return deferred.promise();
        }
    };

    $.fn.nicecomplete = function( method ) {
        var args = arguments;

        return this.each(function() {

            if ( !$.data(this, 'nicecomplete') ) {
                $.data(this, 'nicecomplete', new NiceComplete(this, method));
                return;
            }

            var api = $.data(this, 'nicecomplete');

            if ( typeof method === 'string' && method.charAt(0) !== '_' && api[ method ] ) {
                api[ method ].apply( api, Array.prototype.slice.call( args, 1 ) );
            } else {
                $.error( 'Method ' +  method + ' does not exist on jQuery.nicecomplete' );
            }
        });
    };
})();
