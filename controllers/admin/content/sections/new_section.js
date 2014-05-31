/**
 * NewSection - Input for creating a new site section
 * 
 * @author Blake Callens <blake@pencilblue.org>
 * @copyright PencilBlue 2014, All rights reserved
 */
function NewSection(){
	this.navItem = null;
}

//dependencies
var SectionService = pb.SectionService;

//inheritance
util.inherits(NewSection, pb.BaseController);

//statics
var SUB_NAV_KEY = 'new_section';

NewSection.prototype.render = function(cb) {
	var self = this;
	
	//gather all data
	this.gatherData(function(err, data) {
		if (util.isError(err)) {
			throw err;
		}
		else if(!data.section) {
			self.reqHandler.serve404();
			return;
		}
		
		self.navItem = data.section;
        var angularData = pb.js.getAngularController(data);
    	self.getTemplate(function(err, result) {
			result = result.split('^angular_script^').join(angularData);
            cb({content: result});
        });
	});
};

NewSection.prototype.getTemplate = function(cb) {
	this.ts.registerLocal('content_type', '{{section.type}}');
	this.ts.registerLocal('selection_id_field', 'item');
    this.ts.registerLocal('content_search_value', '');
	this.ts.load('admin/content/sections/new_section', cb);
};

NewSection.prototype.getPageName = function() {
	return this.ls.get('NEW_NAV_ITEM');
};

NewSection.prototype.gatherData = function(cb) {
	async.series(this.getDataTasks(), cb);
};

NewSection.prototype.getDataTasks = function() {
	var self = this;
	return {
			
		//get editors
		editors: function(callback) {
			pb.users.getEditorSelectList(self.session.authentication.user_id, callback);
		},
		
		//get parents
		parents: function(callback) {
			var sectionService = new pb.SectionService();
			sectionService.getParentSelectList(self.pathVars.id, callback);
		},
		
		//form tabs
		tabs: function(callback) {
			var tabs = [
	            {
	                active: 'active',
	                href: '#section_settings',
	                icon: 'cog',
	                title: self.ls.get('SETTINGS')
	            },
	            {
	                href: '#section_seo',
	                icon: 'tasks',
	                title: self.ls.get('SEO')
	            }
	        ];
			callback(null, tabs);
		},
		
		navigation: function(callback) {
			callback(null, pb.AdminNavigation.get(self.session, ['content', 'sections'], self.ls));
		},
		
		types: function(callback) {
			callback(null, SectionService.getTypes(self.ls));
		},
		
		section: function(callback) {
			if (self.session.fieldValues) {
				var navItem = self.session.fieldValues;
				if (util.isArray(navItem.keywords)) {
					navItem.keywords = navItem.keywords.join(',');
				}
				self.session.fieldValues = undefined;
				callback(null, navItem);
			}
			else {
				var navItem = {
					type: 'container'	
				};
				callback(null, navItem);
			}
		},
        
        //breadcrumbs 
		pills: function(callback) {
			var pills = pb.AdminSubnavService.get(self.getSubnavKey(), self.ls, self.getSubnavKey(), self.navItem);
            callback(null, pills);
		},
	};
};

NewSection.prototype.getSubnavKey = function() {
    return SUB_NAV_KEY;   
}

NewSection.getSubNavItems = function(key, ls, data) {
	var pills = SectionService.getPillNavOptions();
    pills.unshift(
    {
        name: 'manage_topics',
        title: ls.get('NEW_NAV_ITEM'),
        icon: 'chevron-left',
        href: '/admin/content/sections/section_map'
    });
    return pills;
};

//register admin sub-nav
pb.AdminSubnavService.registerFor(SUB_NAV_KEY, NewSection.getSubNavItems);

//exports
module.exports = NewSection;
