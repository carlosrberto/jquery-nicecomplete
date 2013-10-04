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
* Version: 0.3
*/

(function($) {
    var defaults = {
        renderResults: true,
        cycleResultsNav: false,
        searchDelay: 400,
        showHideDelay: 300,
        resultsSelector: '.nc-results-list',
        linkSelector: '>a',
        activeClass: 'nc-item-active',

        url: function(p) {
            return '/search/autocomplete/?size=30x30&q=' + p;
        },

        parseResults: function(data) {
            return data.results || data;
        },

        renderResultItem: function( item ) {
            var html = '' +
            '<li>'+
                '<a href="'+item.url+'" class="link">'+
                    '<div class="image"><img src="'+item.img+'"></div>'+
                    '<p class="title">'+item.name+'</p>'+
                    '<p class="price">R$ '+ item.price +'</p>'+
                '</a>'+
            '</li>';
            return html;
        }
    };

    var NiceComplete = function(el, options) {
        this.el = $(el);
        this.options = $.extend({}, defaults, options);
        this.resultsContainer = $(this.options.resultsSelector);
        this.lastText = null;
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
            this.el.on('load.nicecomplete', $.proxy(function(event, data){
                this._renderResults(data);
            }, this));

            this.el.on('keyup.nicecomplete', $.proxy(this._keyUpHandler, this));
            this.el.on('focus.nicecomplete', $.proxy(this._focusHander, this));
            this.el.on('blur.nicecomplete', $.proxy(this._blurHandler, this));

            if ( this.options.renderResults ) {
                this.el.on('keydown.nicecomplete', $.proxy(this._keyDownHandler, this));
            }
        },

        _handleResultsNavigation: function(event) {
            if ( this.resultsContainer.is(':empty') ) {
                return;
            }

            var keyCode = event.keyCode,
                arrowPressed = keyCode === 38 || keyCode === 40,
                arrowUp = keyCode === 38,
                arrowDown = keyCode === 40,
                current = this.resultsContainer.find('.'+this.options.activeClass+':eq(0)'),
                next;

            if ( arrowPressed ) {
                event.preventDefault();

                if ( current.length === 0 && arrowDown ) {
                    next = this.resultsContainer.find('>*').first();
                    next.addClass(this.options.activeClass);
                    return;
                }

                if ( arrowUp ) { // up
                    next = current.prev();

                    if ( this.options.cycleResultsNav && !next.length ) {
                        next = this.resultsContainer.find('>*').last();
                    }
                }

                if ( arrowDown ) { // down
                    next = current.next();

                    if ( this.options.cycleResultsNav &&  !next.length ) {
                        next = this.resultsContainer.find('>*').first();
                    }
                }

                if ( next.length ) {
                    next.addClass(this.options.activeClass);
                    current.removeClass(this.options.activeClass);
                } else if( !next.length && arrowUp ) {
                    current.removeClass(this.options.activeClass);
                }
            }
        },

        _handleResultSelection: function(event) {
            var linkEl = this.resultsContainer.find('.'+this.options.activeClass+':eq(0) ' + this.options.linkSelector),
                url = linkEl.attr('href');
            if ( event.keyCode === 13 && !this.resultsContainer.is(':empty') && url ) {
                event.preventDefault();
                location.href = url;
            }
        },

        _hide: function() {
            var that = this;
            setTimeout(function(){
                that.resultsContainer.hide();
                that.el.trigger('hide.nicecomplete');
            }, this.options.showHideDelay);
        },

        _show: function() {
            var that = this;
            setTimeout(function(){
                that.resultsContainer.show();
                that.el.trigger('show.nicecomplete');
            }, this.options.showHideDelay);
        },

        _blurHandler: function(event) {
            this._hide();
        },

        _focusHander: function(event) {
            this._show();
        },

        _keyUpHandler: function(event) {
            var text = this.el.val();
            if ( text.length === 0  || text.length > 2 ) {
                this._searchTimer(text);
            }

            // esc key
            if (event.keyCode === 27) {
                this.el.trigger('blur');
            }
        },

        _keyDownHandler: function(event) {
            this._handleResultSelection(event);
            this._handleResultsNavigation(event);
        },

        _searchTimer: function(text) {
            var that = this;
            if ( !this.delayInProgress ) {
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
                        }).fail(function(){
                            clearTimeout(that.searchInterval);
                            that.delayInProgress = false;
                        });
                    } else {
                        clearTimeout(that.searchInterval);
                        that.delayInProgress = false;
                    }
                }, this.options.searchDelay);
            }
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
        },

        _renderResults: function( data ) {
            var resultsContainer = this.resultsContainer,
                resultsList = this.options.parseResults(data),
                renderItem = this.options.renderResultItem;

            if ( resultsList.length > 0 ) {
                this.el.trigger('results.nicecomplete', [resultsList]);
            } else {
                this.el.trigger('noresults.nicecomplete');
            }

            resultsContainer.empty();
            $.each(resultsList, function(index, item){
                resultsContainer.append(renderItem(item));
            });
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
})(jQuery);
