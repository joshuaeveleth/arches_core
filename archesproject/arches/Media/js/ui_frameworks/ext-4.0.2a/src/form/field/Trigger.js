/*

This file is part of Ext JS 4

Copyright (c) 2011 Sencha Inc

Contact:  http://www.sencha.com/contact

Commercial Usage
Licensees holding valid commercial licenses may use this file in accordance with the Commercial Software License Agreement provided with the Software or, alternatively, in accordance with the terms contained in a written agreement between you and Sencha.

If you are unsure which license is appropriate for your use, please contact the sales department at http://www.sencha.com/contact.

*/
/**
 * @class Ext.form.field.Trigger
 * @extends Ext.form.field.Text
 * <p>Provides a convenient wrapper for TextFields that adds a clickable trigger button (looks like a combobox by default).
 * The trigger has no default action, so you must assign a function to implement the trigger click handler by
 * overriding {@link #onTriggerClick}. You can create a Trigger field directly, as it renders exactly like a combobox
 * for which you can provide a custom implementation. 
 * {@img Ext.form.field.Trigger/Ext.form.field.Trigger.png Ext.form.field.Trigger component}
 * For example:</p>
 * <pre><code>
Ext.define('Ext.ux.CustomTrigger', {
    extend: 'Ext.form.field.Trigger',
    alias: 'widget.customtrigger',
    
    // override onTriggerClick
    onTriggerClick: function() {
        Ext.Msg.alert('Status', 'You clicked my trigger!');
    }
});

Ext.create('Ext.form.FormPanel', {
    title: 'Form with TriggerField',
    bodyPadding: 5,
    width: 350,
    renderTo: Ext.getBody(),
    items:[{
        xtype: 'customtrigger',
        fieldLabel: 'Sample Trigger',
        emptyText: 'click the trigger',
    }]
});
</code></pre>
 *
 * <p>However, in general you will most likely want to use Trigger as the base class for a reusable component.
 * {@link Ext.form.field.Date} and {@link Ext.form.field.ComboBox} are perfect examples of this.</p>
 *
 * @constructor
 * Create a new Trigger field.
 * @param {Object} config Configuration options (valid {@Ext.form.field.Text} config options will also be applied
 * to the base Text field)
 */
Ext.define('Ext.form.field.Trigger', {
    extend:'Ext.form.field.Text',
    alias: ['widget.triggerfield', 'widget.trigger'],
    requires: ['Ext.core.DomHelper', 'Ext.util.ClickRepeater', 'Ext.layout.component.field.Trigger'],
    alternateClassName: ['Ext.form.TriggerField', 'Ext.form.TwinTriggerField', 'Ext.form.Trigger'],

    fieldSubTpl: [
        '<input id="{id}" type="{type}" ',
            '<tpl if="name">name="{name}" </tpl>',
            '<tpl if="size">size="{size}" </tpl>',
            '<tpl if="tabIdx">tabIndex="{tabIdx}" </tpl>',
            'class="{fieldCls} {typeCls}" autocomplete="off" />',
        '<div class="{triggerWrapCls}" role="presentation">',
            '{triggerEl}',
            '<div class="{clearCls}" role="presentation"></div>',
        '</div>',
        {
            compiled: true,
            disableFormats: true
        }
    ],

    /**
     * @cfg {String} triggerCls
     * An additional CSS class used to style the trigger button.  The trigger will always get the
     * {@link #triggerBaseCls} by default and <tt>triggerCls</tt> will be <b>appended</b> if specified.
     * Defaults to undefined.
     */

    /**
     * @cfg {String} triggerBaseCls
     * The base CSS class that is always added to the trigger button. The {@link #triggerCls} will be
     * appended in addition to this class.
     */
    triggerBaseCls: Ext.baseCSSPrefix + 'form-trigger',

    /**
     * @cfg {String} triggerWrapCls
     * The CSS class that is added to the div wrapping the trigger button(s).
     */
    triggerWrapCls: Ext.baseCSSPrefix + 'form-trigger-wrap',

    /**
     * @cfg {Boolean} hideTrigger <tt>true</tt> to hide the trigger element and display only the base
     * text field (defaults to <tt>false</tt>)
     */
    hideTrigger: false,

    /**
     * @cfg {Boolean} editable <tt>false</tt> to prevent the user from typing text directly into the field;
     * the field can only have its value set via an action invoked by the trigger. (defaults to <tt>true</tt>).
     */
    editable: true,

    /**
     * @cfg {Boolean} readOnly <tt>true</tt> to prevent the user from changing the field, and
     * hides the trigger.  Supercedes the editable and hideTrigger options if the value is true.
     * (defaults to <tt>false</tt>)
     */
    readOnly: false,

    /**
     * @cfg {Boolean} selectOnFocus <tt>true</tt> to select any existing text in the field immediately on focus.
     * Only applies when <tt>{@link #editable editable} = true</tt> (defaults to <tt>false</tt>).
     */

    /**
     * @cfg {Boolean} repeatTriggerClick <tt>true</tt> to attach a {@link Ext.util.ClickRepeater click repeater}
     * to the trigger. Defaults to <tt>false</tt>.
     */
    repeatTriggerClick: false,


    /**
     * @hide
     * @method autoSize
     */
    autoSize: Ext.emptyFn,
    // private
    monitorTab: true,
    // private
    mimicing: false,
    // private
    triggerIndexRe: /trigger-index-(\d+)/,

    componentLayout: 'triggerfield',

    initComponent: function() {
        this.wrapFocusCls = this.triggerWrapCls + '-focus';
        this.callParent(arguments);
    },

    // private
    onRender: function(ct, position) {
        var me = this,
            triggerCls,
            triggerBaseCls = me.triggerBaseCls,
            triggerWrapCls = me.triggerWrapCls,
            triggerConfigs = [],
            i;

        // triggerCls is a synonym for trigger1Cls, so copy it.
        // TODO this trigger<n>Cls API design doesn't feel clean, especially where it butts up against the
        // single triggerCls config. Should rethink this, perhaps something more structured like a list of
        // trigger config objects that hold cls, handler, etc.
        if (!me.trigger1Cls) {
            me.trigger1Cls = me.triggerCls;
        }

        // Create as many trigger elements as we have trigger<n>Cls configs, but always at least one
        for (i = 0; (triggerCls = me['trigger' + (i + 1) + 'Cls']) || i < 1; i++) {
            triggerConfigs.push({
                cls: [Ext.baseCSSPrefix + 'trigger-index-' + i, triggerBaseCls, triggerCls].join(' '),
                role: 'button'
            });
        }
        triggerConfigs[i - 1].cls += ' ' + triggerBaseCls + '-last';

        Ext.applyIf(me.renderSelectors, {
            /**
             * @property triggerWrap
             * @type Ext.core.Element
             * A reference to the div element wrapping the trigger button(s). Only set after the field has been rendered.
             */
            triggerWrap: '.' + triggerWrapCls
        });
        Ext.applyIf(me.subTplData, {
            triggerWrapCls: triggerWrapCls,
            triggerEl: Ext.core.DomHelper.markup(triggerConfigs),
            clearCls: me.clearCls
        });

        me.callParent(arguments);

        /**
         * @property triggerEl
         * @type Ext.CompositeElement
         * A composite of all the trigger button elements. Only set after the field has been rendered.
         */
        me.triggerEl = Ext.select('.' + triggerBaseCls, true, me.triggerWrap.dom);

        me.doc = Ext.isIE ? Ext.getBody() : Ext.getDoc();
        me.initTrigger();
    },

    onEnable: function() {
        this.callParent();
        this.triggerWrap.unmask();
    },
    
    onDisable: function() {
        this.callParent();
        this.triggerWrap.mask();
    },
    
    afterRender: function() {
        this.callParent();
        this.updateEditState();
    },

    updateEditState: function() {
        var me = this,
            inputEl = me.inputEl,
            triggerWrap = me.triggerWrap,
            noeditCls = Ext.baseCSSPrefix + 'trigger-noedit',
            displayed,
            readOnly;

        if (me.rendered) {
            if (me.readOnly) {
                inputEl.addCls(noeditCls);
                readOnly = true;
                displayed = false;
            } else {
                if (me.editable) {
                    inputEl.removeCls(noeditCls);
                    readOnly = false;
                } else {
                    inputEl.addCls(noeditCls);
                    readOnly = true;
                }
                displayed = !me.hideTrigger;
            }

            triggerWrap.setDisplayed(displayed);
            inputEl.dom.readOnly = readOnly;
            me.doComponentLayout();
        }
    },

    /**
     * Get the total width of the trigger button area. Only useful after the field has been rendered.
     * @return {Number} The trigger width
     */
    getTriggerWidth: function() {
        var me = this,
            triggerWrap = me.triggerWrap,
            totalTriggerWidth = 0;
        if (triggerWrap && !me.hideTrigger && !me.readOnly) {
            me.triggerEl.each(function(trigger) {
                totalTriggerWidth += trigger.getWidth();
            });
            totalTriggerWidth += me.triggerWrap.getFrameWidth('lr');
        }
        return totalTriggerWidth;
    },

    setHideTrigger: function(hideTrigger) {
        if (hideTrigger != this.hideTrigger) {
            this.hideTrigger = hideTrigger;
            this.updateEditState();
        }
    },

    /**
     * @param {Boolean} editable True to allow the user to directly edit the field text
     * Allow or prevent the user from directly editing the field text.  If false is passed,
     * the user will only be able to modify the field using the trigger.  Will also add
     * a click event to the text field which will call the trigger. This method
     * is the runtime equivalent of setting the 'editable' config option at config time.
     */
    setEditable: function(editable) {
        if (editable != this.editable) {
            this.editable = editable;
            this.updateEditState();
        }
    },

    /**
     * @param {Boolean} readOnly True to prevent the user changing the field and explicitly
     * hide the trigger.
     * Setting this to true will superceed settings editable and hideTrigger.
     * Setting this to false will defer back to editable and hideTrigger. This method
     * is the runtime equivalent of setting the 'readOnly' config option at config time.
     */
    setReadOnly: function(readOnly) {
        if (readOnly != this.readOnly) {
            this.readOnly = readOnly;
            this.updateEditState();
        }
    },

    // private
    initTrigger: function() {
        var me = this,
            triggerWrap = me.triggerWrap,
            triggerEl = me.triggerEl;

        if (me.repeatTriggerClick) {
            me.triggerRepeater = Ext.create('Ext.util.ClickRepeater', triggerWrap, {
                preventDefault: true,
                handler: function(cr, e) {
                    me.onTriggerWrapClick(e);
                }
            });
        } else {
            me.mon(me.triggerWrap, 'click', me.onTriggerWrapClick, me);
        }

        triggerEl.addClsOnOver(me.triggerBaseCls + '-over');
        triggerEl.each(function(el, c, i) {
            el.addClsOnOver(me['trigger' + (i + 1) + 'Cls'] + '-over');
        });
        triggerEl.addClsOnClick(me.triggerBaseCls + '-click');
        triggerEl.each(function(el, c, i) {
            el.addClsOnClick(me['trigger' + (i + 1) + 'Cls'] + '-click');
        });
    },

    // private
    onDestroy: function() {
        var me = this;
        Ext.destroyMembers(me, 'triggerRepeater', 'triggerWrap', 'triggerEl');
        delete me.doc;
        me.callParent();
    },

    // private
    onFocus: function() {
        var me = this;
        this.callParent();
        if (!me.mimicing) {
            me.bodyEl.addCls(me.wrapFocusCls);
            me.mimicing = true;
            me.mon(me.doc, 'mousedown', me.mimicBlur, me, {
                delay: 10
            });
            if (me.monitorTab) {
                me.on('specialkey', me.checkTab, me);
            }
        }
    },

    // private
    checkTab: function(me, e) {
        if (!this.ignoreMonitorTab && e.getKey() == e.TAB) {
            this.triggerBlur();
        }
    },

    // private
    onBlur: Ext.emptyFn,

    // private
    mimicBlur: function(e) {
        if (!this.isDestroyed && !this.bodyEl.contains(e.target) && this.validateBlur(e)) {
            this.triggerBlur();
        }
    },

    // private
    triggerBlur: function() {
        var me = this;
        me.mimicing = false;
        me.mun(me.doc, 'mousedown', me.mimicBlur, me);
        if (me.monitorTab && me.inputEl) {
            me.un('specialkey', me.checkTab, me);
        }
        Ext.form.field.Trigger.superclass.onBlur.call(me);
        if (me.bodyEl) {
            me.bodyEl.removeCls(me.wrapFocusCls);
        }
    },

    beforeBlur: Ext.emptyFn,

    // private
    // This should be overridden by any subclass that needs to check whether or not the field can be blurred.
    validateBlur: function(e) {
        return true;
    },

    // private
    // process clicks upon triggers.
    // determine which trigger index, and dispatch to the appropriate click handler
    onTriggerWrapClick: function(e) {
        var me = this,
            t = e && e.getTarget('.' + Ext.baseCSSPrefix + 'form-trigger', null),
            match = t && t.className.match(me.triggerIndexRe),
            idx,
            triggerClickMethod;

        if (match && !me.readOnly) {
            idx = parseInt(match[1], 10);
            triggerClickMethod = me['onTrigger' + (idx + 1) + 'Click'] || me.onTriggerClick;
            if (triggerClickMethod) {
                triggerClickMethod.call(me, e);
            }
        }
    },

    /**
     * The function that should handle the trigger's click event.  This method does nothing by default
     * until overridden by an implementing function.  See Ext.form.field.ComboBox and Ext.form.field.Date for
     * sample implementations.
     * @method
     * @param {Ext.EventObject} e
     */
    onTriggerClick: Ext.emptyFn

    /**
     * @cfg {Boolean} grow @hide
     */
    /**
     * @cfg {Number} growMin @hide
     */
    /**
     * @cfg {Number} growMax @hide
     */
});

