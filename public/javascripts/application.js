jQuery.noConflict();

Shadowbox.loadSkin('classic', '/javascripts/shadowbox');
jQuery(document).ready(function(){
    Shadowbox.init();
});

var lastElement = null;
var lastPrefix = null;
var lastColor = null;
var comments = new Hash();
var last_shout = null;
var show_tooltips = 1;
var fetchTimeout = null;
var fetchElement = null;


// -------------------------
// show progress spinner
//

function showProgress() {
	jQuery('#loading').show('fast');
}
function hideProgress() {
	jQuery('#loading').hide('fast');
}

jQuery(document).mousemove(function(e) {
	if(jQuery('#loading').is(':visible')) {
		jQuery("#loading").css({
            top: (e.pageY  - 8) + "px",
            left: (e.pageX + 10) + "px"
        });
	}
});

jQuery("#loading").bind("ajaxSend", function(){
   jQuery(this).show('fast');
 }).bind("ajaxComplete", function(){
   jQuery(this).hide('fast');
});

// -------------------------

function fetchComment(e) {
  var elements = e.toString().split("/");
  var taskId = elements[elements.size()-1];
  jQuery.get('/tasks/get_comment/' + taskId + ".js", function(data) {updateComment(taskId);} );
}

function updateComment(taskId) {
  if(taskId != null) {
    var comment = comments.get(taskId);
    if( comment != null && comment != "" ) {
      var elements = comment.split("<br/>");
      var author = elements.shift();
      Element.insert("task_tooltip", { bottom: "<tr><th>"+ author + "</th><td class=\"tip_description\">" + elements.join("<br/>") + "</td></tr>"  } );
    }
  }
}

function init_shout() {
  if($('shout_body')) {
    Event.observe($('shout_body'), "keypress", function(e) {
        switch( e.keyCode ) {
        case Event.KEY_RETURN:
          if (e.shiftKey) {
            return;
          } else {
            if($('shout_body').value.length > 0) {
              if(e.ctrlKey || e.metaKey) {
                $('shout-input').onsubmit();
                $('shout_body').value = '';
              } else {
                $('shout-input').onsubmit();
                $('shout_body').value = '';
              }
            }
            Event.stop(e);
          }
        }
      });
  }
}

function inline_image(el) {
  $(el).setStyle({width:'auto', visibility:'hidden'});
  if (el.width > 500) {
    el.style.width = '500px';
  }
  el.style.visibility = 'visible';
}

function UpdateDnD() {
  updateTooltips();
}

/*
 Tooltips are setup on page load, but sometimes the page is updated
 using ajax, and the tooltips need to be setup again, so this method
 sets up tooltips in page.
*/
function updateTooltips() {
    jQuery('.tooltip').tooltip({showURL: false });    
}

function do_update(user, url) {
  if( user != userId ) {
      jQuery.get(url);
  }
}

// used by Juggernaut
function do_execute(user, code) {
  if( user != userId ) {
    eval(code);
  }
}

function json_decode(txt) {
  try {
    return eval( '(' + txt + ')' );
  } catch(ex) {}
}

function updateSelect(sel, response) {
   response.evalScripts();

   var lines = response.split('\n');

   var obj = json_decode(lines[0]);
   sel.options.length = 0;
   var opts = obj.options;
   for( var i=0; i<opts.length; i++ ) {
     sel.options[i] = new Option(opts[i].text,opts[i].value,null,false);
   }
}

function toggleChatPopupEvent(e) {
  var el = Event.element(e);
  toggleChatPopup(el);
}

function toggleChatPopup(el) {
  if( Element.hasClassName(el.up(), 'presence-section-active') ) {
    Element.removeClassName(el.up(), 'presence-section-active');
    $$("#" + el.up().id + " .presence-shadow").each(function(e) { Element.hide(e); });
	jQuery.get('/shout/chat_hide/' + el.up().id);
  } else if(Element.hasClassName(el.up(), 'presence-section')) {
    $$('.presence-section-active').each(function(el) {
					  Element.removeClassName(el, 'presence-section-active');
					  $$(".presence-shadow").each(function(el) { Element.hide(el); });
					});
    Element.addClassName(el.up(), 'presence-section-active');

    if( Element.hasClassName(el.up(), 'presence-section-pending') ) {
      Element.removeClassName(el.up(), 'presence-section-pending');
    }
    jQuery("#" + el.up().id + " .presence-shadow").show();
    jQuery("#" + el.up().id + " input").focus();

	jQuery.get('/shout/chat_show/' + el.up().id);
  }
}

function closeChat(el) {
  jQuery.get('/shout/chat_close/' + el.up().id);
  jQuery(el).remove();
}

// refresh the milestones select menu for all milestones from project pid, setting the selected milestone to mid
function refreshMilestones(pid, mid) {
  jQuery.getJSON("/tasks/get_milestones", {project_id: pid},
	function(data) {
		var milestoneSelect = jQuery('#task_milestone_id').get(0);
		rebuildSelect(milestoneSelect, data.options);
		milestoneSelect.options[mid].selected = true;
  });
}

function rebuildSelect(select, data) {
   select.options.length = 0;
   for( var i=0; i<data.length; i++ ) {
     select.options[i] = new Option(data[i].text,data[i].value,null,false);
   }
}

jQuery(document).ready(function() {
    fixNestedCheckboxes();
    
    var taskList = jQuery("#task_list");
    if (taskList) {
	taskListLoaded();

	taskList.resizable({
	    resize: function(event, ui) {
		ui.element.css("width", "");
	    }
	});
    }
});

jQuery.fn.dateToWords = function() {
    return this.each(function() {
	dateToWords(jQuery(this))
    });
}

function dateToWords(elem) {
    var date = elem.text();
    var text = date;
    var className = null;

    date = jQuery.datepicker.parseDate("yy-mm-dd", date)

    if (date != null) {
	var diff = (((new Date()).getTime() - date.getTime()) / 1000);
	var dayDiff = Math.floor(diff / 86400);

	if (isNaN(dayDiff)) {
	    text = date;
	}
	else if (dayDiff == -1) {
	    text = "Tomorrow";
	    className = "due_tomorrow";
	}
	else if (dayDiff == 0) {
	    text = "Today";
	    className = "due";
	}
	else if (dayDiff == 1) {
	    text = "Yesterday"
	    className = "due_overdue";
	}
	else if (dayDiff < 0) {
	    dayDiff = Math.abs(dayDiff);
	    text = dayDiff + " days"
	    className = dayDiff >= 7 ? "due_distant" : "due_soon";
	}
	else if (dayDiff > 0) {
	    text = dayDiff + " days ago"
	    className = "due_overdue";
	}
    }

    elem.addClass(className);
    elem.text(text);
}

/*
 Callback for when the task list has finished loading.
*/
function taskListLoaded() {
    hideProgress(); 
    Shadowbox.setup(); 
    updateTooltips();
    jQuery('.date_to_words').dateToWords();
    showTaskListColumns();
}

/*
  Shows or hides any columns in the task list according to 
  the current user's preferences
*/
function showTaskListColumns() {
    var list = jQuery("#task_list #list");
    var hidden = window.hiddenColumns || [];

    var opts = { 
	listTargetID: "column_picker",
	onClass: 'shown', offClass: 'hidden',
	hideInList: [ 1 ],
	colsHidden: hidden,

	onToggle: function(index, state) {
	    var columns = jQuery("#column_picker li");
	    var hidden = []
	    for (var i = 0; i < columns.length; i++) {
		var column = jQuery(columns[i]);
		if (column.hasClass("hidden")) {
		    hidden.push(i + 2);
		}
	    }
	    saveUserPreference("hidden_task_list_columns", hidden);
	}
    };

    list.columnManager(opts);
}

/*
  Loads the task information for the task taskNum and displays 
it in the current page.
*/
function showTaskInPage(taskNum) {
    jQuery("#task_list tr.selected").removeClass("selected");
    jQuery("#task_list #task_row_" + taskNum).addClass("selected");

    jQuery("#task").fadeOut();
    jQuery.get("/tasks/edit/" + taskNum, {}, function(data) {
	jQuery("#task").html(data);
	jQuery("#task").fadeIn('slow');
    });
}

/*
 Marks the task sender belongs to as unread.
 Also removes the "unread" class from the task html.
 If userId is given, that will be sent too.
 */
function toggleTaskUnread(event, userId) {
    var task = jQuery(event.target).parents(".task");
    
    var unread = task.hasClass("unread");
    task.toggleClass("unread");

    var taskId = task.attr("id").replace("task_row_", "");
    var taskId = taskId.replace("task_", "");
    var parameters = { "id" : taskId, "read" : unread };
    if (userId) {
	parameters["user_id"] = userId;
    }

    jQuery.post("/tasks/set_unread",  parameters);
    
    event.stopPropagation();
    return false;
}

/*
 Clears the text in the given field
*/
function clearPrompt(field) {
    field.value = "";
}

/*
Removes the search filter the link belongs to and submits
the containing form.
*/
function removeSearchFilter(link) {
    link = jQuery(link);
    var form = link.parents("form");
    link.parent(".search_filter").remove();

    submitSearchFilterForm();
}

function addSearchFilter(textField, selected) {
    var filter = jQuery("#search_filter");
    filter.val(jQuery.trim(filter.val()));

    selected = jQuery(selected);
    var idField = selected.find(".id");
    var typeField = selected.find(".type");
    var columnField = selected.find(".column");
    
    if (idField && idField.length > 0) {
	var filterForm = jQuery("#search_filter_form");
	filterForm.append(idField.clone());
	filterForm.append(typeField.clone());
	if (columnField) {
	    filterForm.append(columnField.clone());
	}
	submitSearchFilterForm();
    }
    else {
	// probably selected a heading, just ignore
    }
}

/* 
Submits the search filter form. If we are looking at the task list, 
does that via ajax. Otherwise does a normal html post
*/
function submitSearchFilterForm() {
    var form = jQuery("#search_filter_form")[0];
    var redirect = jQuery(form.redirect_action).val();
    if (redirect.indexOf("/tasks/list?") >= 0) {
	form.onsubmit();
    }
    else {
	form.submit();
    }
}

/* 
Sets up the search filter input field to add a task automatically
if a number is entered and then the user hits enter
*/
function addSearchFilterTaskIdListener(filter) {
    var filter = jQuery("#search_filter");

    filter.keypress(function(key) {
	// if key was enter
	var id = filter.val();
	if (key.keyCode == 13 && id.match(/^\d+$/)) {
	    var form = jQuery("#search_filter_form");

	    var new_fields = '<input type="hidden" name="task_filter[qualifiers_attributes][][task_num]" value="' + id  + '" />';

	    form.find(".links").html(new_fields);
	    submitSearchFilterForm();
	}
    });
}

function addProjectToUser(input, li) {
    li = jQuery(li);
    var value = li.find(".complete_value").text();
    
    var url = document.location.toString();
    url = url.replace("/edit/", "/project/");
    jQuery.get(url, { project_id: value }, function(data) {
	jQuery("#add_user").before(data);
    });

    input.value = "";
}

function addUserToProject(input, li) {
    li = jQuery(li);
    var value = li.find(".complete_value").text();
    
    var url = document.location.toString();
    url = url.replace("/edit/", "/ajax_add_permission/");
    jQuery.get(url, { user_id : value }, function(data) {
	jQuery("#user_table").html(data);
    });

    input.value = "";
}

/*
 This function adds in the selected value to the previous autocomplete.
 The autocomplete text field itself will be updated with the name, and
 a hidden field directly before the text field will be updated with the object id.
*/
function updateAutoCompleteField(input, li) {
    li = jQuery(li);
    input = jQuery(input);

    var id = li.find(".complete_value").text();
    input.siblings(".auto_complete_id").val(id);

    li.find(".complete_value").remove();
    input.val(li.text());
}

/*
  Requests the available attributes for the given resource type
  and updates the page with the returned values.
*/
function updateResourceAttributes(select) {
    select = jQuery(select)
    var typeId = select.val();
    var target = jQuery("#attributes");

    if (typeId == "") {
	target.html("");
    }
    else {
	var url = "/resources/attributes/?type_id=" + typeId;
	jQuery.get(url, function(data) {
	    target.html(data);
	});
    }
}

/*
  Adds a new field to allow people to have multiple values
  for resource attributes.
*/
function addAttribute(link) {
    link = jQuery(link);
    var origAttribute = link.parent(".attribute");

    var newAttribute = origAttribute.clone();
    newAttribute.find(".value").val("");
    newAttribute.find("a.add_attribute").remove();
    newAttribute.find(".attr_id").remove();

    var removeLink = newAttribute.find("a.remove_attribute")
    // for some reason this onclick needs to be manually set after cloning
    removeLink.click(function() { removeAttribute(removeLink); })
    removeLink.show();

    origAttribute.after(newAttribute);
}

/*
  Removes the resource attribute to the link
*/
function removeAttribute(link) {
    link = jQuery(link);
    link.parent(".attribute").remove();
}
// I'm not sure why, but we seem to need to add these for the event
// to fire - onclick doesn't seem to work.
jQuery(document).ready(function() {
    jQuery(".remove_attribute").click(function(evt) { 
	removeAttribute(evt.target); 
    });
});

/*
 Shows / hides applicabel attribute fields depending on the value
 of checkbox
*/
function updateAttributeFields(checkbox) {
    checkbox = jQuery(checkbox);
    var preset = checkbox.is(":checked");

    var parent = checkbox.parents(".attribute");
    var maxLength = parent.find(".max_length");
    var choices = parent.find(".choices");
    var choiceLink = parent.find(".add_choice_link");
    var multiple = parent.find(".multiple");

    if (preset) {
	multiple.hide().find("input").attr("checked", false);
	maxLength.hide().find("input").val("");
	choices.show();
	choiceLink.show();
    }
    else {
	multiple.show();
	maxLength.show();
	choices.hide().html("");
	choiceLink.hide();
    }
}

/*
 Adds fields to setup a new custom attribute choice.
*/
function addAttributeChoices(sender) {
    var choices = jQuery(sender).parent().find('.choices');
    var callback = function() { updatePositionFields(choices); }

    var attribute = jQuery(sender).parents(".attribute");
    var attrId = attribute.attr("id").split("_").pop();

    if (attrId == "attribute") {
	// new attribute, so just ignore
	attrId = "";
    }
    var url = "/custom_attributes/choice/" + attrId;
    appendPartial(url, choices, callback);
}

/*
  Does a get request to the given url. The response is appended
  to any element matching selector.
  If a callback function is given, that will be called after the partial
  has been loaded and added to the page.
*/
function appendPartial(url, selector, callback) {
    jQuery.get(url, { }, function(data) {
	jQuery(selector).append(data);

	if (callback) { callback.call(); }
    });
}

/*
  Adds the selected dependency to the task currently being edited.
  The task must be saved for the dependency to be permanently linked.
*/
function addDependencyToTask(input, li) {
    var id = jQuery(li).find(".complete_value").text();
    jQuery(input).val("");

    jQuery.get("/tasks/dependency/", { dependency_id : id }, function(data) {
	jQuery("#task_dependencies .dependencies").append(data);
    });
}
/*
  Adds the selected resource to the task currently being edited.
  The task must be saved for the resource to be permanently linked.
*/
function addResourceToTask(input, li) {
    var id = jQuery(li).find(".complete_value").text();
    jQuery(input).val("");

    jQuery.get("/tasks/resource/", { resource_id : id }, function(data) {
	jQuery("#task_resources").append(data);
    });
}
/*
  Removes the link from resource to task
*/
function removeTaskResource(link) {
    link = jQuery(link);
    var parent = link.parent(".resource_no");
    parent.remove();
}

/*
  Retrieves the password from the given url, and updated
  the nearest password div with the returned value.
*/
function showPassword(link, url) {
    link = jQuery(link);
    link.hide();

    var passwordDiv = link.prev(".password");
    passwordDiv.load(url);
}

/*
  Checkboxes for nested forms cause trouble in params parsing 
  when index => nil. This function fixes the problem by disabling the
  form element that is not in use.
*/
function nestedCheckboxChanged(checkbox) {
    checkbox = jQuery(checkbox);
    var checked = checkbox.attr("checked");
    
    var hiddenField = checkbox.prev();
    if (hiddenField.attr("name") == checkbox.attr("name")) {
	hiddenField.attr("disabled", checked);
    }
}

/*
    The function nestedCheckboxChanged will fix any 
    checkboxes that are changed, but this function should be called 
    on page load to fix any already in the page (generally because they
    failed a validation.
*/
function fixNestedCheckboxes() {
    var checkboxes = jQuery(".nested_checkbox");
    for (var i = 0; i < checkboxes.length; i++) {
	var cb = checkboxes[i];
	nestedCheckboxChanged(cb) 
    }
}

/*
 Toggles the visiblity of the element next to sender.
 Updates the text of sender to "Show" or "Hide" as appropriate.
 Pass selector as null to just hide the immediately preceding element.
*/
function togglePreviousElement(sender, selector) {
    sender = jQuery(sender);
    var toggle = sender.prev();
    if (selector) {
	toggle = jQuery(selector);
    }

    if (toggle.is(':visible')) {
	sender.text("Show");
    }
    else {
	sender.text("Hide");
    }

    toggle.toggle();
}

function updatePositionFields(listSelector) {
    var list = jQuery(listSelector);
    var children = list.children();

    for (var i = 0; i < children.length; i++) {
	var positionField = jQuery(children[i]).find(".position");
	positionField.val(i + 1);
    }
}

/* FILTER METHODS */

function removeTaskFilter(sender) {
    var li = jQuery(sender).parent();
    var form = li.parents("form");
    li.remove();

    form.submit();
}

function addTaskFilter(sender, id, field_name) {
    var li = jQuery(sender);
    var html = "<input type='hidden' name='" + field_name + "' value='" + id + "' />";
    li.append(html);
    jQuery("#filter_form").submit();
}

/* TASK OWNER METHODS */
function removeTaskUser(sender) {
    sender = jQuery(sender);
    sender.parent(".user").remove();
}

function toggleTaskIcon(sender, baseClassName, enabledClassName) {
    var div = jQuery(sender).parents(".user");

    var input = div.find("input." + baseClassName);
    var icon = div.find(".icon." + baseClassName);

    if (input.attr("disabled")) {
	icon.addClass(enabledClassName)
	input.attr("disabled", false);
    }
    else {
	input.attr("disabled", true);
	icon.removeClass(enabledClassName);
    }
}

/*
  Adds the selected user to the current tasks list of users
*/
function addUserToTask(input, li) {
    jQuery(input).val("");

    var userId = jQuery(li).find(".complete_value").text();
    var taskId = jQuery("#task_id").val();

    var url = "/tasks/add_notification";
    var params = { user_id : userId, id : taskId }
    jQuery.get(url, params, function(data) {
	jQuery("#task_notify").append(data);
	highlightActiveNotifications();
    });
}

/*
  Adds the selected customer to the current task list of clients
*/
function addCustomerToTask(input, li) {
    jQuery(input).val("");

    var clientId = jQuery(li).find(".complete_value").text();
    var taskId = jQuery("#task_id").val();

    var url = "/tasks/add_client";
    var params = { client_id : clientId, id : taskId }
    jQuery.get(url, params, function(data) {
	jQuery("#task_customers").append(data);
    });

    addAutoAddUsersToTask(clientId, taskId);
}

/*
  Adds any users setup as auto add to the current task.
*/
function addAutoAddUsersToTask(clientId, taskId, projectId) {
    var url = "/tasks/add_users_for_client";
    var params = { client_id : clientId, id : taskId, project_id : projectId }
    jQuery.get(url, params, function(data) {
	jQuery("#task_notify").append(data);
    });
}

/*
  If this task has no linked clients yet, link the one that
  project belongs to and update the display.
*/
function addClientLinkForTask(projectId) {
    var customers = jQuery("#task_customers").text();
    
    if (jQuery.trim(customers) == "") {
	var url = "/tasks/add_client_for_project";
	var params = { project_id : projectId }
	jQuery.get(url, params, function(data) {
	    jQuery("#task_customers").html(data);
	});
    }
}

/*
  Highlights any notification users who will be receiving an email
  about this task.
*/
function highlightActiveNotifications() {
    var users = jQuery("#taskform .user");
    var hasComment = jQuery("#comment").val() != "";
    var isNew = (document.location.toString().indexOf("/new") > 0);

    for (var i = 0; i < users.length; i++) {
	var div = jQuery(users[i]);
	var willNeverReceive = div.hasClass("will_never_receive");
	var notify = div.find(".icon.should_notify");
	if (!willNeverReceive &&
	    (hasComment || isNew)
	    && notify.length > 0) {
	    div.addClass("will_notify");
	}
	else {
	    div.removeClass("will_notify");
	}
    }
}

/*
  Called when a task is moved in the task list. 
*/
function moveTask(event, ui) {
    var element = ui.draggable[0];
    var dropTarget = event.target;

    jQuery(element).remove(); 

    jQuery.get("/tasks/move", 
	       { id : element.id + " " + dropTarget.id }, 
	       null,
	      "script")
}

/*
  Toggles the approval status of the given work log
*/
function toggleWorkLogApproval(sender, workLogId) {
    var checked = jQuery(sender).attr("checked");

    jQuery.post("/tasks/update_work_log", {
	id : workLogId,
	"work_log[approved]" : checked });
}


// Sortable table helpers

/*
  Makes the given table sortable.
  If defaultSortColumn and defaultSortOrder are given, the table will
  initally be sorted according to those values
*/
function makeSortable(table, defaultSortColumn, defaultSortOrder) {
    var sort = [ [ 0, 1 ] ];

    if (defaultSortColumn && defaultSortColumn != "") {
	var selector = "th:contains('" + defaultSortColumn + "')";
	var headers = table.find("th");
	var column = table.find(selector);
	var index = headers.index(column);
	if (index < 0) { index = 0; }

	var dir = (defaultSortOrder == "up" ? 1 : 0);
	sort = [ [ index, dir ] ];
    }

    table.tablesorter({
	sortList: sort,
	widgets: ["zebra"],
	textExtraction: tableSortText, //"complex",
	headers: {
	    5: { sorter : "digit" }
	}
    });
}

/*
  Returns the text to sort a table by from the given node
*/
function tableSortText(node) {
    var res = node.innerHTML;
    var node = jQuery(node);

    var hint = node.children(".sort_hint");
    if (hint.length > 0) {
	res = hint.text();
    }

    res = jQuery.trim(res).toLowerCase();
    return res;
}

/*
  Saves the sort params to session for the given event
*/
function saveSortParams(event) {
    var table = jQuery(event.target);
    var selected = table.find(".headerSortDown");
    var direction = "down";
    if (selected.length == 0) {
	selected = table.find(".headerSortUp");
	direction = "up";
    }

    selected = jQuery.trim(selected.text());

    jQuery.post("/task_filters/set_single_task_filter", {
    	name : "sort",
    	value : (selected + "_" + direction)
    });
}

// TODOS

/*
Toggles the todo display or edit fields
*/
function toggleTodoEdit(sender) {
    var todo = jQuery(sender).parents(".todo");
    var display = todo.find(".display");
    var edit = todo.find(".edit");

    display.toggle();
    edit.toggle();
}

/*
Adds listeners to handle users pressing enter in the todo
edit field
*/
function addTodoKeyListener(todoId, taskId) {
    var todo = jQuery("#todos-" + todoId);
    var input = todo.find(".edit input");
    
    input.keypress(function(key) {
	if (key.keyCode == 13) {
	    jQuery(".todo-container").load("/todos/update/" + todoId,  {
		"_method": "PUT",
		task_id: taskId,
		"todo[name]": input.val()
	    });

	    key.stopPropagation();
	    return false;
	}
    });
}

/*
Adds listeners to handle users pressing enter in the todo
create field
*/
function addNewTodoKeyListener(taskId) {
    var todo = jQuery("#new-todos");
    var input = todo.find(".edit input");
    
    input.keypress(function(key) {
	if (key.keyCode == 13) {
	    jQuery(".todo-container").load("/todos/create", {
		"_method": "POST",
		task_id: taskId,
		"todo[name]": input.val()
	    });

	    key.stopPropagation();
	    return false;
	}
    });
}

function setPageTarget(evt, selected) {
    var id = jQuery(selected).find(".id").val();
    var type = jQuery(selected).find(".type").val();

    jQuery("#page_notable_id").val(id);
    jQuery("#page_notable_type").val(type);
}


/*
  Sends an ajax request to save the given user preference to the db
*/
function saveUserPreference(name, value) {
    var params = { "name": name, "value": value.toSource() }
    jQuery.post("/users/set_preference",  params);
}
