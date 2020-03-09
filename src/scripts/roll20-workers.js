on("sheet:compendium-drop", function() {
	getAttrs(["hp_max","npc_senses","token_size","cd_bar1_v","cd_bar1_m","cd_bar1_l","cd_bar2_v","cd_bar2_m","cd_bar2_l","cd_bar3_v","cd_bar3_m","cd_bar3_l"], function(v) {

		var default_attr = {};
		default_attr["width"] = 70;
		default_attr["height"] = 70;
		if(v["npc_senses"].toLowerCase().match(/(darkvision|blindsight|tremorsense|truesight)/)) {
			default_attr["light_radius"] = Math.max.apply(Math, v["npc_senses"].match(/\d+/g));
		}
		if(v["token_size"]) {
			var squarelength = 70;
			if(v["token_size"].toString().indexOf(",") > -1) {
				var setwidth = !isNaN(v["token_size"].split(",")[0]) ? v["token_size"].split(",")[0] : 1;
				var setheight = !isNaN(v["token_size"].split(",")[1]) ? v["token_size"].split(",")[1] : 1;
				default_attr["width"] = setwidth * squarelength;
				default_attr["height"] = setheight * squarelength;
			}
			else {
				default_attr["width"] = squarelength * v["token_size"]
				default_attr["height"] = squarelength * v["token_size"]
			};
		}

		var getList = {};
		for(x = 1; x<=3; x++) {
			_.each(["v", "m"], function(letter) {
				var keyname = "cd_bar" + x + "_" + letter;
				if(v[keyname] != undefined && isNaN(v[keyname])) {
					getList[keyname] = v[keyname];
				}
			});
		}

		getAttrs(_.values(getList), function(values) {
			_.each(_.keys(getList), function(keyname) {
				v[keyname] = values[getList[keyname]] == undefined ? "" : values[getList[keyname]];
			});

			if(v["cd_bar1_l"]) {
				default_attr["bar1_link"] = v["cd_bar1_l"];
			}
			else if(v["cd_bar1_v"] || v["cd_bar1_m"]) {
				if(v["cd_bar1_v"]) {
					default_attr["bar1_value"] = v["cd_bar1_v"];
				}
				if(v["cd_bar1_m"]) {
					default_attr["bar1_max"] = v["cd_bar1_m"];
				}
			}
			else {
				default_attr["bar1_value"] = v["hp_max"];
				default_attr["bar1_max"] = v["hp_max"];
			}

			if(v["cd_bar2_l"]) {
				default_attr["bar2_link"] = v["cd_bar2_l"];
			}
			else if(v["cd_bar2_v"] || v["cd_bar2_m"]) {
				if(v["cd_bar2_v"]) {
					default_attr["bar2_value"] = v["cd_bar2_v"];
				}
				if(v["cd_bar2_m"]) {
					default_attr["bar2_max"] = v["cd_bar2_m"];
				}
			}
			else {
				default_attr["bar2_link"] = "npc_ac";
			}

			if(v["cd_bar3_l"]) {
				default_attr["bar3_link"] = v["cd_bar3_l"];
			}
			else if(v["cd_bar3_v"] || v["cd_bar3_m"]) {
				if(v["cd_bar3_v"]) {
					default_attr["bar3_value"] = v["cd_bar3_v"];
				}
				if(v["cd_bar3_m"]) {
					default_attr["bar3_max"] = v["cd_bar3_m"];
				}
			}

			setDefaultToken(default_attr);
		});
	});
});

['strength','dexterity','constitution','intelligence','wisdom','charisma'].forEach(attr => {
	on(`change:${attr}_base change:${attr}_bonus`, function() {
		update_attr(`${attr}`);

	});
});

['strength','dexterity','constitution','intelligence','wisdom','charisma'].forEach(attr => {
	on(`change:${attr}`, function() {
		update_mod(`${attr}`);

		const cap = attr.charAt(0).toUpperCase() + attr.slice(1);
		check_customac(cap);

		(attr === "strength") ? update_weight() : false;
		(attr === "dexterity") ? update_initiative() : false;
		(attr === "intelligence") ? update_initiative() : false;
	});
});

['strength','dexterity','constitution','intelligence','wisdom','charisma'].forEach(attr => {
	on(`change:${attr}_mod`, function() {
		update_save(`${attr}`);
		update_attacks(`${attr}`);
		update_tool(`${attr}`);
		update_spell_info(`${attr}`);

		switch(`${attr}`) {
			case "strength":
				update_skills(["athletics"]);
				break;
			case "dexterity":
				update_skills(["acrobatics", "sleight_of_hand", "stealth"]);
				update_ac();
				update_initiative();
				break;
			case "intelligence":
				update_skills(["arcana", "history", "investigation", "nature", "religion"]);
				update_initiative();
				break;
			case "wisdom":
				update_skills(["animal_handling", "insight", "medicine", "perception", "survival"]);
				break;
			case "charisma":
				update_skills(["deception", "intimidation", "performance", "persuasion"]);
				break;
			default:
				false;
		}
	});
});

['strength','dexterity','constitution','intelligence','wisdom','charisma'].forEach(attr => {
	on(`change:${attr}_save_prof change:${attr}_save_mod`, function(eventinfo) {
		if(eventinfo.sourceType === "sheetworker") {return;};
		update_save(`${attr}`);
	});
});

on("change:globalsavemod", function(eventinfo) {
	if(eventinfo.sourceType === "sheetworker") {return;};
	update_all_saves();
});

on("change:death_save_mod", function(eventinfo) {
	if(eventinfo.sourceType === "sheetworker") {return;};
	update_save("death");
});

['acrobatics','animal_handling','arcana','athletics','deception','history','insight','intimidation','investigation', 'medicine','nature','perception','performance','persuasion','religion','sleight_of_hand','stealth','survival'].forEach(attr => {
	on(`change:${attr}_prof change:${attr}_type change:${attr}_flat change:${attr}_attribute`, function(eventinfo) {
		if(eventinfo.sourceType === "sheetworker") {return;};
		update_skills([`${attr}`]);
	});
});

on("change:repeating_tool:toolname change:repeating_tool:toolbonus_base change:repeating_tool:toolattr_base change:repeating_tool:tool_mod", function(eventinfo) {
	if(eventinfo.sourceType === "sheetworker") {
		return;
	}
	var tool_id = eventinfo.sourceAttribute.substring(15, 35);
	update_tool(tool_id);
});

on("change:repeating_attack:atkname change:repeating_attack:atkflag change:repeating_attack:atkattr_base change:repeating_attack:atkmod change:repeating_attack:atkmagic change:repeating_attack:atkprofflag change:repeating_attack:dmgflag change:repeating_attack:dmgbase change:repeating_attack:dmgattr change:repeating_attack:dmgmod change:repeating_attack:dmgtype change:repeating_attack:dmg2flag change:repeating_attack:dmg2base change:repeating_attack:dmg2attr change:repeating_attack:dmg2mod change:repeating_attack:dmg2type change:repeating_attack:saveflag change:repeating_attack:savedc change:repeating_attack:saveflat change:repeating_attack:dmgcustcrit change:repeating_attack:dmg2custcrit change:repeating_attack:ammo change:repeating_attack:saveattr change:repeating_attack:atkrange", function(eventinfo) {
	if(eventinfo.sourceType === "sheetworker") {
		return;
	}

	var source = eventinfo.sourceAttribute.substr(38);
	var attackid = eventinfo.sourceAttribute.substring(17, 37);
	if(source == "atkattr_base" || source == "savedc") {
		getAttrs(["repeating_attack_spellid", "repeating_attack_spelllevel"], function(v) {
			set = {};
			if(v.repeating_attack_spellid && v.repeating_attack_spellid != "" && v.repeating_attack_spelllevel && v.repeating_attack_spelllevel != "") {
				var newVal = eventinfo.newValue == "spell" ? "spell" : _.last(eventinfo.newValue.split("_")[0].split("{"));
				set["repeating_attack_atkattr_base"] = newVal == "spell" ? "spell" : "@{" + newVal + "_mod}";
				set["repeating_attack_savedc"] = newVal == "spell" ? "spell" : "(@{" + newVal + "_mod}+8+@{pb})";
				set["repeating_spell-" + v.repeating_attack_spelllevel + "_" + v.repeating_attack_spellid + "_spell_ability"] = newVal == "spell" ? "spell" : "@{" + newVal + "_mod}+";
			}
			setAttrs(set, function() {
				update_attacks(attackid);
			});
		});
	} else {
		update_attacks(attackid);
	}
});

on("change:repeating_damagemod remove:repeating_damagemod", function(eventinfo) {
	update_globaldamage();
});

on("change:global_damage_mod_flag", function(eventinfo) {
	getSectionIDs("damagemod", function(ids) {
		var update = {};
		if(eventinfo.newValue === "1") {
			if(!ids || ids.length === 0) {
				var rowid = generateRowID();
				update[`repeating_damagemod_${rowid}_global_damage_active_flag`] = "1";
			}
		} else {
			_.each(ids, function(rowid) {
				update[`repeating_damagemod_${rowid}_global_damage_active_flag`] = "0";
			});
		}
		setAttrs(update);
	});
});

on("change:exhaustion_toggle", function(eventinfo) {
	if(eventinfo.newValue !== "0") {
		getAttrs(["exhaustion_level"], function(attrs) {
			if(!attrs.exhaustion_level || attrs.exhaustion_level === "") {
				var update = {};
				update.exhaustion_level = "0";
				setAttrs(update);
			}
		});
	}
});

on("change:exhaustion_level", function(eventinfo) {
	const newValue = parseInt(eventinfo.newValue) || 0, previousValue = parseInt(eventinfo.previousValue) || 0;
	let update = {};

	 if (newValue === 0) {
		//If exhaustion is 0 the reset exhaustion_1 to "No Effect" and blank the other spans
		for(let i = 2; i <= 6; i++) { update[`exhaustion_${i}`] = ""}
		update[`exhaustion_1`] = "• " + getTranslationByKey(`exhaustion-0`)
	} else if (newValue > previousValue) {
		//If exhaustion increase then add text to the spans
		for(let i = previousValue; i <= newValue; i++)
		{update[`exhaustion_${i}`] = "• " + getTranslationByKey(`exhaustion-${i}`)}
	} else {
		//If exhaustion decrease remove text from spans
		for(let i = newValue + 1; i <= previousValue; i++) {update[`exhaustion_${i}`] = ""}
	};

	setAttrs(update, {silent: true});
});

on("change:race change:subrace", function(eventinfo) {
	update_race_display();
});

on("change:drop_category", function(eventinfo) {
	if(eventinfo.newValue === "Monsters") {
		getAttrs(["class","race","speed","hp"], function(v) {
			if(v["class"] != "" || v["race"] != "" || v["speed"] != "" || v["hp"] != "") {
				setAttrs({monster_confirm_flag: 1});
			}
			else {
				handle_drop(eventinfo.newValue);
			}
		});
	}
	else {
		handle_drop(eventinfo.newValue);
	}
});

on(`change:repeating_inventory:hasattack`, function(eventinfo) {
	if(eventinfo.sourceType && eventinfo.sourceType === "sheetworker") {return;};

	const itemid = eventinfo.sourceAttribute.substring(20, 40);
	getAttrs([`repeating_inventory_${itemid}_itemattackid`], function(v) {
		const hasattack = eventinfo.newValue, itemattackid = v[`repeating_inventory_${itemid}_itemattackid`];
		(hasattack == 1) ? create_attack_from_item(itemid) : remove_attack(itemattackid);
	});
});

on(`change:repeating_inventory:useasresource`, function(eventinfo) {
	if(eventinfo.sourceType && eventinfo.sourceType === "sheetworker") {return;};

	const itemid = eventinfo.sourceAttribute.substring(20, 40);
	getAttrs([`repeating_inventory_${itemid}_itemresourceid`], function(v) {
		const useasresource = eventinfo.newValue, itemresourceid = v[`repeating_inventory_${itemid}_itemresourceid`];
		(useasresource == 1) ? create_resource_from_item(itemid) : remove_resource(itemresourceid);
	});
});

on("change:repeating_inventory:itemname change:repeating_inventory:itemproperties change:repeating_inventory:itemmodifiers change:repeating_inventory:itemcount", function(eventinfo) {
	if(eventinfo.sourceType && eventinfo.sourceType === "sheetworker") {
		return;
	}

	var itemid = eventinfo.sourceAttribute.substring(20, 40);
	getAttrs(["repeating_inventory_" + itemid + "_itemattackid", "repeating_inventory_" + itemid + "_itemresourceid"], function(v) {
		var attackid = v["repeating_inventory_" + itemid + "_itemattackid"];
		var resourceid = v["repeating_inventory_" + itemid + "_itemresourceid"];
		if(attackid) {
			update_attack_from_item(itemid, attackid);
		}
		if(resourceid) {
			update_resource_from_item(itemid, resourceid);
		}
	});
});

on("change:other_resource change:other_resource_name change:repeating_resource:resource_left change:repeating_resource:resource_left_name change:repeating_resource:resource_right change:repeating_resource:resource_right_name", function(eventinfo) {

	if(eventinfo.sourceType && eventinfo.sourceType === "sheetworker") {
		return;
	}

	var resourceid = eventinfo.sourceAttribute;
	if(eventinfo.sourceAttribute.indexOf("other") > -1) {
		resourceid = "other_resource";
	}
	else if(eventinfo.sourceAttribute.substring(eventinfo.sourceAttribute.length - 5) == "_name") {
		resourceid = eventinfo.sourceAttribute.substring(0, eventinfo.sourceAttribute.length - 5);
	};

	getAttrs([resourceid, resourceid + "_name", resourceid + "_itemid"], function(v) {
		if(!v[resourceid + "_name"]) {
			remove_resource(resourceid);
		}
		else if(v[resourceid + "_itemid"] && v[resourceid + "_itemid"] != ""){
			update_item_from_resource(resourceid, v[resourceid + "_itemid"]);
		};
	});

});

on("change:repeating_inventory:itemcontainer change:repeating_inventory:equipped change:repeating_inventory:carried change:repeating_inventory:itemweight change:repeating_inventory:itemcount change:cp change:sp change:ep change:gp change:pp change:currency_other change:encumberance_setting change:size change:carrying_capacity_mod change:use_inventory_slots change:inventory_slots_mod change:repeating_inventory:itemweightfixed change:repeating_inventory:itemslotsfixed change:repeating_inventory:itemsize change:repeating_inventory:itemcontainer_slots_modifier", function() {
	update_weight();
});

on("change:repeating_inventory:itemmodifiers change:repeating_inventory:equipped change:repeating_inventory:carried", function(eventinfo) {
	if(eventinfo.sourceType && eventinfo.sourceType === "sheetworker") {
		return;
	}
	var itemid = eventinfo.sourceAttribute.substring(20, 40);
	getAttrs(["repeating_inventory_" + itemid + "_itemmodifiers"], function(v) {
		if(v["repeating_inventory_" + itemid + "_itemmodifiers"]) {
			check_itemmodifiers(v["repeating_inventory_" + itemid + "_itemmodifiers"], eventinfo.previousValue);
		};
	});
});

on("change:custom_ac_flag change:custom_ac_base change:custom_ac_part1 change:custom_ac_part2 change:custom_ac_shield", function(eventinfo) {
	if(eventinfo.sourceType && eventinfo.sourceType === "sheetworker") {
		return;
	}
	update_ac();
});

['spell-cantrip','spell-1','spell-2','spell-3','spell-4','spell-5','spell-6','spell-7','spell-8','spell-9'].forEach(attr => {
	on(`change:repeating_${attr}:includedesc change:repeating_${attr}:innate change:repeating_${attr}:spell_ability change:repeating_${attr}:spell_updateflag change:repeating_${attr}:spellathigherlevels change:repeating_${attr}:spellattack change:repeating_${attr}:spelldamage change:repeating_${attr}:spelldamage2 change:repeating_${attr}:spelldamagetype change:repeating_${attr}:spelldamagetype2 change:repeating_${attr}:spelldescription change:repeating_${attr}:spelldmgmod change:repeating_${attr}:spellhealing change:repeating_${attr}:spellhlbonus change:repeating_${attr}:spellhldie change:repeating_${attr}:spellhldietype change:repeating_${attr}:spellname change:repeating_${attr}:spellprepared change:repeating_${attr}:spellrange change:repeating_${attr}:spellsave change:repeating_${attr}:spellsavesuccess change:repeating_${attr}:spelltarget change:repeating_${attr}:spell_damage_progression`, (eventinfo) => {
		if(eventinfo.sourceType && eventinfo.sourceType === "sheetworker") { return; }

		const spellid = eventinfo.sourceAttribute.split("_")[2], repeating_source = `repeating_${attr}_${spellid}`;
		getAttrs([repeating_source + "_spellattackid", repeating_source + "_spelllevel"], function(v) {
			var attackid = v[repeating_source + "_spellattackid"];
			var lvl			= v[repeating_source + "_spelllevel"];

			if(attackid && lvl && spellid) {
				update_attack_from_spell(lvl, spellid, attackid)
			}
		});
	});
});

['spell-cantrip','spell-1','spell-2','spell-3','spell-4','spell-5','spell-6','spell-7','spell-8','spell-9'].forEach(attr => {
	on(`change:repeating_${attr}:spelloutput`, (eventinfo) => {
		if(eventinfo.sourceType && eventinfo.sourceType === "sheetworker") {return;}

		const spellid = eventinfo.sourceAttribute.split("_")[2], repeating_source = `repeating_${attr}_${spellid}`;
		getAttrs([`${repeating_source}_spellattackid`, `${repeating_source}_spelllevel`, `${repeating_source}_spellathigherlevels`, "character_id"], function(v) {
			const attackid		 = v[repeating_source + "_spellattackid"];
			const higherlevels = v[repeating_source + "_spellathigherlevels"];
			const spelloutput	= eventinfo.newValue;
			let lvl						= v[repeating_source + "_spelllevel"];

			if (spelloutput && spelloutput === "ATTACK") {
				create_attack_from_spell(lvl, spellid, v["character_id"]);
			} else if (spelloutput && spelloutput === "SPELLCARD" && attackid && attackid != "") {
				let lvl = parseInt(v[repeating_source + "_spelllevel"], 10);
				remove_attack(attackid);
				update_spelloutput(higherlevels, lvl, repeating_source, spelloutput);
			}
		});
	});
});

['spell-cantrip','spell-1','spell-2','spell-3','spell-4','spell-5','spell-6','spell-7','spell-8','spell-9'].forEach(attr => {
	on(`change:repeating_${attr}:spellathigherlevels`, (eventinfo) => {
		if(eventinfo.sourceType && eventinfo.sourceType === "sheetworker") {return;}

		const spellid = eventinfo.sourceAttribute.split("_")[2], repeating_source = `repeating_${attr}_${spellid}`;
		getAttrs([`${repeating_source}_spelllevel`, `${repeating_source}_spelloutput`], function(v) {
			const higherlevels = eventinfo.newValue;
			const lvl					= parseInt(v[repeating_source + "_spelllevel"], 10);
			const spelloutput	= v[repeating_source + "_spelloutput"];

			if (spelloutput && spelloutput === "SPELLCARD") {
				update_spelloutput(higherlevels, lvl, repeating_source, spelloutput);
			}
		});
	});
});

const update_spelloutput = (higherlevels, lvl, repeating_source, spelloutput)	=> {
	let spelllevel = "@{spelllevel}";
	let update = {};

	if (higherlevels) {
		for(i = 0; i < 10-lvl; i++) {
			let tot = parseInt(i, 10) + parseInt(lvl, 10);
			spelllevel = spelllevel + "|Level " + tot + "," + tot;
		}
		spelllevel = `?{Cast at what level? ${spelllevel}}`;
	}
	update[repeating_source + "_rollcontent"] = "@{wtype}&{template:spell} {{level=@{spellschool} " + spelllevel + "}} {{name=@{spellname}}} {{castingtime=@{spellcastingtime}}} {{range=@{spellrange}}} {{target=@{spelltarget}}} @{spellcomp_v} @{spellcomp_s} @{spellcomp_m} {{material=@{spellcomp_materials}}} {{duration=@{spellduration}}} {{description=@{spelldescription}}} {{athigherlevels=@{spellathigherlevels}}} @{spellritual} {{innate=@{innate}}} @{spellconcentration} @{charname_output}";

	setAttrs(update, {silent: true});
};

on("change:class change:custom_class change:cust_classname change:cust_hitdietype change:cust_spellcasting_ability change:cust_spellslots change:cust_strength_save_prof change:cust_dexterity_save_prof change:cust_constitution_save_prof change:cust_intelligence_save_prof change:cust_wisdom_save_prof change:cust_charisma_save_prof change:subclass change:multiclass1 change:multiclass1_subclass change:multiclass2 change:multiclass2_subclass change:multiclass3 change:multiclass3_subclass" , function(eventinfo) {
	if(eventinfo.sourceType && eventinfo.sourceType === "sheetworker") {
		return;
	}
	update_class();
});

on("change:base_level change:multiclass1_flag change:multiclass1 change:multiclass1_lvl change:multiclass2_flag change:multiclass2 change:multiclass2_lvl change:multiclass3_flag change:multiclass3 change:multiclass3_lvl change:arcane_fighter change:arcane_rogue", function(eventinfo) {
	if(eventinfo.sourceType && eventinfo.sourceType === "sheetworker") {
		return;
	}
	set_level();
});

on("change:level_calculations change:caster_level change:lvl1_slots_mod change:lvl2_slots_mod change:lvl3_slots_mod change:lvl4_slots_mod change:lvl5_slots_mod change:lvl6_slots_mod change:lvl7_slots_mod change:lvl8_slots_mod change:lvl9_slots_mod", function(eventinfo) {
	if(eventinfo.sourceType && eventinfo.sourceType === "sheetworker") {
		return;
	}
	getAttrs(["level_calculations"], function(v) {
		if(!v["level_calculations"] || v["level_calculations"] == "on") {
			update_spell_slots();
		};
	});
});

on("change:caster_level", function(eventinfo) {
	getAttrs(["caster_level","npc"], function(v) {
		var casterlvl = v["caster_level"] && !isNaN(parseInt(v["caster_level"], 10)) ? parseInt(v["caster_level"], 10) : 0;
		if(v["npc"] && v["npc"] == 1 && casterlvl > 0) {
			setAttrs({level: casterlvl})
		};
	});
});

on("change:pb_type change:pb_custom", function(eventinfo) {
	if(eventinfo.sourceType && eventinfo.sourceType === "sheetworker") {
		return;
	}
	update_pb();
});

on("change:dtype", function(eventinfo) {
	if(eventinfo.sourceType && eventinfo.sourceType === "sheetworker") {
		return;
	}
	update_attacks("all");
	update_npc_action("all");
});

on("change:jack_of_all_trades", function(eventinfo) {
	if(eventinfo.sourceType && eventinfo.sourceType === "sheetworker") {
		return;
	}
	update_jack_attr();
	update_all_ability_checks();
});

on("change:initmod change:init_tiebreaker change:use_intelligent_initiative", function(eventinfo) {
	if(eventinfo.sourceType && eventinfo.sourceType === "sheetworker") {
		return;
	}
	update_initiative();
});

on("change:spellcasting_ability change:spell_dc_mod change:globalmagicmod", function(eventinfo) {
	if(eventinfo.sourceType && eventinfo.sourceType === "sheetworker") {
		return;
	}
	update_spell_info();
});

on("change:npc_challenge", function() {
	update_challenge();
});

on("change:npc_str_save_base change:npc_dex_save_base change:npc_con_save_base change:npc_int_save_base change:npc_wis_save_base change:npc_cha_save_base", function(eventinfo) {
	update_npc_saves();
});

on("change:npc_acrobatics_base change:npc_animal_handling_base change:npc_arcana_base change:npc_athletics_base change:npc_deception_base change:npc_history_base change:npc_insight_base change:npc_intimidation_base change:npc_investigation_base change:npc_medicine_base change:npc_nature_base change:npc_perception_base change:npc_performance_base change:npc_persuasion_base change:npc_religion_base change:npc_sleight_of_hand_base change:npc_stealth_base change:npc_survival_base", function(eventinfo) {
	update_npc_skills();
});

on("change:repeating_npcaction:attack_flag change:repeating_npcaction:attack_type change:repeating_npcaction:attack_range change:repeating_npcaction:attack_target change:repeating_npcaction:attack_tohit change:repeating_npcaction:attack_damage change:repeating_npcaction:attack_damagetype change:repeating_npcaction:attack_damage2 change:repeating_npcaction:attack_damagetype2 change:repeating_npcaction-l:attack_flag change:repeating_npcaction-l:attack_type change:repeating_npcaction-l:attack_range change:repeating_npcaction-l:attack_target change:repeating_npcaction-l:attack_tohit change:repeating_npcaction-l:attack_damage change:repeating_npcaction-l:attack_damagetype change:repeating_npcaction-l:attack_damage2 change:repeating_npcaction-l:attack_damagetype2 change:repeating_npcaction:show_desc change:repeating_npcaction-l:show_desc change:repeating_npcaction:description change:repeating_npcaction-l:description", function(eventinfo) {
	var actionid = eventinfo.sourceAttribute.substring(20, 40);
	var legendary = eventinfo.sourceAttribute.indexOf("npcaction-l") > -1 ? true : false;
	if(legendary) {
		actionid = eventinfo.sourceAttribute.substring(22, 42);
	}
	update_npc_action(actionid, legendary);
});

on("change:core_die change:halflingluck_flag", function() {
	getAttrs(["core_die","halflingluck_flag"], function(v) {
		core = v.core_die && v.core_die != "" ? v.core_die : "1d20";
		luck = v.halflingluck_flag && v.halflingluck_flag === "1" ? "ro<1" : "";
		update = {};
		update["d20"] = core + luck;
		if(!v.core_die || v.core_die === "") {
			update["core_die"] = "1d20";
		}
		setAttrs(update);
	});
});

[`ac`,`attack`,'save','skill',].forEach(attr => {
	on(`change:global_${attr}_mod_flag`, (eventinfo) => {
		const mod = (attr === "attack") ? "tohitmod" : `${attr}mod`;
		if(eventinfo.newValue === "1") {
			const firstAttr	   = (attr === "ac")  ? "val" : "roll";
			const firstAttrValue  = (attr === "ac")  ? 1 : "1d4";
			const secondAttrValue = (attr === "ac")  ? "Defense" : (attr === "skill") ? "GUIDANCE" : "BLESS";

			getSectionIDs(mod, (ids) => {
				if(!ids || ids.length === 0) {
					var update = {};
					var rowid = generateRowID();
					update[`repeating_${mod}_${rowid}_global_${attr}_${firstAttr}`]= `${firstAttrValue}`;
					update[`repeating_${mod}_${rowid}_global_${attr}_name`]		= `${secondAttrValue}`;
					update[`repeating_${mod}_${rowid}_global_${attr}_active_flag`] = "1";
					setAttrs(update);
				}
			});
		} else {
			getSectionIDs(mod, function(ids) {
				var update = {};
				var rowid = generateRowID();
				_.each(ids, function(rowid) {
					update[`repeating_${mod}_${rowid}_global_${attr}_active_flag`] = "0";
				});
				setAttrs(update);
			});
		}
	});
});

on("change:repeating_skillmod remove:repeating_skillmod", function(eventinfo) {
	update_globalskills();
});

on("change:repeating_savemod remove:repeating_savemod", function(eventinfo) {
	update_globalsaves();
});

on("change:repeating_tohitmod remove:repeating_tohitmod", function(eventinfo) {
	update_globalattack();
});

on("change:repeating_acmod remove:repeating_acmod", function(eventinfo) {
	update_ac();
});

on("change:confirm", function(eventinfo) {
	setAttrs({monster_confirm_flag: ""});
	getAttrs(["drop_category"], function(v) {
		if(v["drop_category"]) {
			handle_drop(v["drop_category"]);
		}
	});
});

on("change:cancel", function(eventinfo) {
	setAttrs({monster_confirm_flag: ""});
	var update = {};
	update["drop_category"] = "";
	update["drop_name"] = "";
	update["drop_data"] = "";
	update["drop_content"] = "";
	setAttrs(update, {silent: true});
});

on("change:passiveperceptionmod", function(eventinfo) {
	update_passive_perception();
});

on("remove:repeating_inventory", function(eventinfo) {
	var itemid = eventinfo.sourceAttribute.substring(20, 40);
	var attackids = eventinfo.removedInfo && eventinfo.removedInfo["repeating_inventory_" + itemid + "_itemattackid"] ? eventinfo.removedInfo["repeating_inventory_" + itemid + "_itemattackid"] : undefined;
	var resourceid = eventinfo.removedInfo && eventinfo.removedInfo["repeating_inventory_" + itemid + "_itemresourceid"] ? eventinfo.removedInfo["repeating_inventory_" + itemid + "_itemresourceid"] : undefined;

	if(attackids) {
		_.each(attackids.split(","), function(value) { remove_attack(value); });
	}
	if(resourceid) {
		remove_resource(resourceid);
	}

	if(eventinfo.removedInfo && eventinfo.removedInfo["repeating_inventory_" + itemid + "_itemmodifiers"]) {
		check_itemmodifiers(eventinfo.removedInfo["repeating_inventory_" + itemid + "_itemmodifiers"]);
	}

	update_weight();
});

on("remove:repeating_attack", function(eventinfo) {
	var attackid = eventinfo.sourceAttribute.substring(17, 37);
	var itemid = eventinfo.removedInfo["repeating_attack_" + attackid + "_itemid"];
	var spellid = eventinfo.removedInfo["repeating_attack_" + attackid + "_spellid"];
	var spelllvl = eventinfo.removedInfo["repeating_attack_" + attackid + "_spelllevel"];
	if(itemid) {
		getAttrs(["repeating_inventory_" + itemid + "_hasattack"], function(v) {
			if(v["repeating_inventory_" + itemid + "_hasattack"] && v["repeating_inventory_" + itemid + "_hasattack"] == 1) {
				var update = {};
				update["repeating_inventory_" + itemid + "_itemattackid"] = "";
				update["repeating_inventory_" + itemid + "_hasattack"] = 0;
				setAttrs(update, {silent: true});
			}
		});
	};
	if(spellid && spelllvl) {
		getAttrs(["repeating_spell-" + spelllvl + "_" + spellid + "_spelloutput"], function(v) {
			if(v["repeating_spell-" + spelllvl + "_" + spellid + "_spelloutput"] && v["repeating_spell-" + spelllvl + "_" + spellid + "_spelloutput"] == "ATTACK") {
				var update = {};
				update["repeating_spell-" + spelllvl + "_" + spellid + "_spellattackid"] = "";
				update["repeating_spell-" + spelllvl + "_" + spellid + "_spelloutput"] = "SPELLCARD";
				setAttrs(update, {silent: true});
			}
		});
	};

});

on("remove:repeating_resource", function(eventinfo) {
	var resourceid = eventinfo.sourceAttribute.substring(19, 39);
	var left_itemid = eventinfo.removedInfo["repeating_resource_" + resourceid + "_resource_left_itemid"];
	var right_itemid = eventinfo.removedInfo["repeating_resource_" + resourceid + "_resource_right_itemid"];
	var update = {};
	if(left_itemid) {
		update["repeating_inventory_" + left_itemid + "_useasresource"] = 0;
		update["repeating_inventory_" + left_itemid + "_itemresourceid"] = "";
	}
	if(right_itemid) {
		update["repeating_inventory_" + right_itemid + "_useasresource"] = 0;
		update["repeating_inventory_" + right_itemid + "_itemresourceid"] = "";
	}
	setAttrs(update, {silent: true});
});

on("remove:repeating_spell-cantrip remove:repeating_spell-1 remove:repeating_spell-2 remove:repeating_spell-3 remove:repeating_spell-4 remove:repeating_spell-5 remove:repeating_spell-6 remove:repeating_spell-7 remove:repeating_spell-8 remove:repeating_spell-9", function(eventinfo) {
	var attackid = eventinfo.removedInfo[eventinfo.sourceAttribute + "_spellattackid"];
	if(attackid) {
		remove_attack(attackid);
	}
});

on("change:experience", function(eventinfo) {
	update_leveler_display();
});

var update_attr = function(attr) {
	var update = {};
	var attr_fields = [attr + "_base",attr + "_bonus"];
	getSectionIDs("repeating_inventory", function(idarray) {
		_.each(idarray, function(currentID, i) {
			attr_fields.push("repeating_inventory_" + currentID + "_equipped");
			attr_fields.push("repeating_inventory_" + currentID + "_itemmodifiers");
		});
		getAttrs(attr_fields, function(v) {
			var base = v[attr + "_base"] && !isNaN(parseInt(v[attr + "_base"], 10)) ? parseInt(v[attr + "_base"], 10) : 10;
			var bonus = v[attr + "_bonus"] && !isNaN(parseInt(v[attr + "_bonus"], 10)) ? parseInt(v[attr + "_bonus"], 10) : 0;
			var item_base = 0;
			var item_bonus = 0;
			_.each(idarray, function(currentID) {
				if((!v["repeating_inventory_" + currentID + "_equipped"] || v["repeating_inventory_" + currentID + "_equipped"] === "1") && v["repeating_inventory_" + currentID + "_itemmodifiers"] && v["repeating_inventory_" + currentID + "_itemmodifiers"].toLowerCase().indexOf(attr > -1)) {
					var mods = v["repeating_inventory_" + currentID + "_itemmodifiers"].toLowerCase().split(",");
					_.each(mods, function(mod) {
						if(mod.indexOf(attr) > -1 && mod.indexOf("save") === -1) {
							if(mod.indexOf(":") > -1) {
								var new_base = !isNaN(parseInt(mod.replace(/[^0-9]/g, ""), 10)) ? parseInt(mod.replace(/[^0-9]/g, ""), 10) : false;
								item_base = new_base && new_base > item_base ? new_base : item_base;
							}
							else if(mod.indexOf("-") > -1) {
								var new_mod = !isNaN(parseInt(mod.replace(/[^0-9]/g, ""), 10)) ? parseInt(mod.replace(/[^0-9]/g, ""), 10) : false;
								item_bonus = new_mod ? item_bonus - new_mod : item_bonus;
							}
							else {
								var new_mod = !isNaN(parseInt(mod.replace(/[^0-9]/g, ""), 10)) ? parseInt(mod.replace(/[^0-9]/g, ""), 10) : false;
								item_bonus = new_mod ? item_bonus + new_mod : item_bonus;
							}
						};
					});
				}
			});

			update[attr + "_flag"] = bonus != 0 || item_bonus > 0 || item_base > base ? 1 : 0;
			base = base > item_base ? base : item_base;
			update[attr] = base + bonus + item_bonus;
			setAttrs(update);
		});
	});
};

var update_mod = function (attr) {
	getAttrs([attr], function(v) {
		var attr_abr = attr.substring(0,3);
		var finalattr = v[attr] && isNaN(v[attr]) === false ? Math.floor((parseInt(v[attr], 10) - 10) / 2) : 0;
		var update = {};
		update[attr + "_mod"] = finalattr;
		update["npc_" + attr_abr + "_negative"] = v[attr] && !isNaN(v[attr]) && parseInt(v[attr], 10) < 10 ? 1 : 0;
		setAttrs(update);
	});
};

var update_save = function (attr) {
	var save_attrs = [attr + "_mod", attr + "_save_prof", attr + "_save_mod","pb","globalsavemod","pb_type"];
	getSectionIDs("repeating_inventory", function(idarray) {
		_.each(idarray, function(currentID, i) {
			save_attrs.push("repeating_inventory_" + currentID + "_equipped");
			save_attrs.push("repeating_inventory_" + currentID + "_itemmodifiers");
		});

		getAttrs(save_attrs, function(v) {
			var attr_mod = v[attr + "_mod"] ? parseInt(v[attr + "_mod"], 10) : 0;
			var prof = v[attr + "_save_prof"] && v[attr + "_save_prof"] != 0 && !isNaN(v["pb"]) ? parseInt(v["pb"], 10) : 0;
			var save_mod = v[attr + "_save_mod"] && !isNaN(parseInt(v[attr + "_save_mod"], 10)) ? parseInt(v[attr + "_save_mod"], 10) : 0;
			var global = v["globalsavemod"] && !isNaN(v["globalsavemod"]) ? parseInt(v["globalsavemod"], 10) : 0;
			var items = 0;
			_.each(idarray, function(currentID) {
				if(v["repeating_inventory_" + currentID + "_equipped"] && v["repeating_inventory_" + currentID + "_equipped"] === "1" && v["repeating_inventory_" + currentID + "_itemmodifiers"] && (v["repeating_inventory_" + currentID + "_itemmodifiers"].toLowerCase().indexOf("saving throws") > -1 || v["repeating_inventory_" + currentID + "_itemmodifiers"].toLowerCase().indexOf(attr + " save") > -1)) {
					var mods = v["repeating_inventory_" + currentID + "_itemmodifiers"].toLowerCase().split(",");
					_.each(mods, function(mod) {
						if(mod.indexOf(attr + " save") > -1) {
							var substr = mod.slice(mod.lastIndexOf(attr + " save") + attr.length + " save".length);
							var bonus = substr && substr.length > 0 && !isNaN(parseInt(substr,10)) ? parseInt(substr,10) : 0;
						}
						else if(mod.indexOf("saving throws") > -1) {
							var substr = mod.slice(mod.lastIndexOf("saving throws") + "saving throws".length);
							var bonus = substr && substr.length > 0 && !isNaN(parseInt(substr,10)) ? parseInt(substr,10) : 0;
						};
						if(bonus && bonus != 0) {
							items = items + bonus;
						};
					});
				}
			});
			var total = attr_mod + prof + save_mod + global + items;
			if(v["pb_type"] && v["pb_type"] === "die" && v[attr + "_save_prof"] != 0 && attr != "death") {
				total = total + "+" + v["pb"];
			};
			var update = {};
			update[attr + "_save_bonus"] = total;
			setAttrs(update, {silent: true});
		});
	});
};

var update_all_saves = function() {
	update_save("strength");
	update_save("dexterity");
	update_save("constitution");
	update_save("intelligence");
	update_save("wisdom");
	update_save("charisma");
	update_save("death");
};

var update_all_ability_checks = function(){
	update_initiative();
	update_skills(["athletics", "acrobatics", "sleight_of_hand", "stealth", "arcana", "history", "investigation", "nature", "religion", "animal_handling", "insight", "medicine", "perception", "survival","deception", "intimidation", "performance", "persuasion"]);
};

var update_skills = function (skills_array) {
	var attrs_to_get = ["pb","pb_type","jack_of_all_trades","jack","strength_mod","dexterity_mod","constitution_mod","intelligence_mod","wisdom_mod","charisma_mod"];
	var update = {};
	var callbacks = [];

	if(skills_array.indexOf("perception") > -1) {
		callbacks.push( function() {update_passive_perception();} )
	};

	_.each(skills_array, function(s) {
		attrs_to_get.push(s + "_attribute")
		attrs_to_get.push(s + "_prof");
		attrs_to_get.push(s + "_type");
		attrs_to_get.push(s + "_flat");
	});

	getSectionIDs("repeating_inventory", function(idarray) {
		_.each(idarray, function(currentID, i) {
			attrs_to_get.push("repeating_inventory_" + currentID + "_equipped");
			attrs_to_get.push("repeating_inventory_" + currentID + "_itemmodifiers");
		});

		getAttrs(attrs_to_get, function(v) {
			_.each(skills_array, function(s) {
				console.log("UPDATING SKILL: " + s);
				var attr_mod = 0;
				if (v[s + "_attribute"]) {
					var attribute = v[s + "_attribute"].toLowerCase() + "_mod";
					attr_mod = parseInt(v[attribute], 10);
				}
				var prof = v[s + "_prof"] != 0 && !isNaN(v["pb"]) ? parseInt(v["pb"], 10) : 0;
				var flat = v[s + "_flat"] && !isNaN(parseInt(v[s + "_flat"], 10)) ? parseInt(v[s + "_flat"], 10) : 0;
				var type = v[s + "_type"] && !isNaN(parseInt(v[s + "_type"], 10)) ? parseInt(v[s + "_type"], 10) : 1;
				var jack = v["jack_of_all_trades"] && v["jack_of_all_trades"] != 0 && v["jack"] ? v["jack"] : 0;
				var item_bonus = 0;

				_.each(idarray, function(currentID) {
					if(v["repeating_inventory_" + currentID + "_equipped"] && v["repeating_inventory_" + currentID + "_equipped"] === "1" && v["repeating_inventory_" + currentID + "_itemmodifiers"] && (v["repeating_inventory_" + currentID + "_itemmodifiers"].toLowerCase().replace(/ /g,"_").indexOf(s) > -1 || v["repeating_inventory_" + currentID + "_itemmodifiers"].toLowerCase().indexOf("ability checks") > -1)) {
						var mods = v["repeating_inventory_" + currentID + "_itemmodifiers"].toLowerCase().split(",");
						_.each(mods, function(mod) {
							if(mod.replace(/ /g,"_").indexOf(s) > -1 || mod.indexOf("ability checks") > -1) {
								if(mod.indexOf("-") > -1) {
									var new_mod = !isNaN(parseInt(mod.replace(/[^0-9]/g, ""), 10)) ? parseInt(mod.replace(/[^0-9]/g, ""), 10) : false;
									item_bonus = new_mod ? item_bonus - new_mod : item_bonus;
								}
								else {
									var new_mod = !isNaN(parseInt(mod.replace(/[^0-9]/g, ""), 10)) ? parseInt(mod.replace(/[^0-9]/g, ""), 10) : false;
									item_bonus = new_mod ? item_bonus + new_mod : item_bonus;
								}
							};
						});
					};
				});

				var total = attr_mod + flat + item_bonus;

				if(v["pb_type"] && v["pb_type"] === "die") {
					if(v[s + "_prof"] != 0) {
						type === 1 ? "" : "2"
						total = total + "+" + type + v["pb"];
					}
					else if(v[s + "_prof"] == 0 && jack != 0) {
						total = total + "+" + jack;
					};
				}
				else {
					if(v[s + "_prof"] != 0) {
						total = total + (prof * type);
					}
					else if(v[s + "_prof"] == 0 && jack != 0) {
						total = total + parseInt(jack, 10);
					};

				};
				update[s + "_bonus"] = total;
			});

			setAttrs(update, {silent: true}, function() {callbacks.forEach(function(callback) {callback(); })} );
		});
	});
};

var update_tool = function(tool_id) {
	if(tool_id.substring(0,1) === "-" && tool_id.length === 20) {
		do_update_tool([tool_id]);
	}
	else if(tool_id === "all") {
		getSectionIDs("repeating_tool", function(idarray) {
			do_update_tool(idarray);
		});
	}
	else {
		getSectionIDs("repeating_tool", function(idarray) {
			var tool_attribs = [];
			_.each(idarray, function(id) {
				tool_attribs.push("repeating_tool_" + id + "_toolattr_base");
			});
			getAttrs(tool_attribs, function(v) {
				var attr_tool_ids = [];
				_.each(idarray, function(id) {
					if(v["repeating_tool_" + id + "_toolattr_base"] && v["repeating_tool_" + id + "_toolattr_base"].indexOf(tool_id) > -1) {
						attr_tool_ids.push(id);
					}
				});
				if(attr_tool_ids.length > 0) {
					do_update_tool(attr_tool_ids);
				}
			});
		});
	};
};

var do_update_tool = function(tool_array) {
	var tool_attribs = ["pb","pb_type","jack","strength_mod","dexterity_mod","constitution_mod","intelligence_mod","wisdom_mod","charisma_mod"];
	var update = {};
	_.each(tool_array, function(tool_id) {
		tool_attribs.push("repeating_tool_" + tool_id + "_toolbonus_base");
		tool_attribs.push("repeating_tool_" + tool_id + "_tool_mod");
		tool_attribs.push("repeating_tool_" + tool_id + "_toolattr_base");
	});

	getAttrs(tool_attribs, function(v) {
		_.each(tool_array, function(tool_id) {
			console.log("UPDATING TOOL: " + tool_id);
			var query = false;
			if(v["repeating_tool_" + tool_id + "_toolattr_base"] && v["repeating_tool_" + tool_id + "_toolattr_base"].substring(0,2) === "?{") {
				update["repeating_tool_" + tool_id + "_toolattr"] = "QUERY";
				var mod = "?{Attribute?|Strength,@{strength_mod}|Dexterity,@{dexterity_mod}|Constitution,@{constitution_mod}|Intelligence,@{intelligence_mod}|Wisdom,@{wisdom_mod}|Charisma,@{charisma_mod}}";
				if(v["repeating_tool_" + tool_id + "_tool_mod"]) {
					mod = mod + "+" + v["repeating_tool_" + tool_id + "_tool_mod"];
				}
				query = true;
			}
			else {
				var attr = v["repeating_tool_" + tool_id + "_toolattr_base"].substring(0, v["repeating_tool_" + tool_id + "_toolattr_base"].length - 5).substr(2);
				var attr_mod = v[attr + "_mod"] ? parseInt(v[attr + "_mod"], 10) : 0;
				var tool_mod = v["repeating_tool_" + tool_id + "_tool_mod"] && !isNaN(parseInt(v["repeating_tool_" + tool_id + "_tool_mod"], 10)) ? parseInt(v["repeating_tool_" + tool_id + "_tool_mod"], 10) : 0;
				var mod = attr_mod + tool_mod;
				update["repeating_tool_" + tool_id + "_toolattr"] = attr.toUpperCase();
				if(v["repeating_tool_" + tool_id + "_tool_mod"] && v["repeating_tool_" + tool_id + "_tool_mod"].indexOf("@{") > -1) {
					update["repeating_tool_" + tool_id + "_toolbonus"] = update["repeating_tool_" + tool_id + "_toolbonus"] + "+" + v["repeating_tool_" + tool_id + "_tool_mod"];
				}
				if(!v["repeating_tool_" + tool_id + "_tool_mod"]) {
					update["repeating_tool_" + tool_id + "_tool_mod"] = 0;
				}
			};

			if(v["pb_type"] && v["pb_type"] === "die" ) {
				if(v["repeating_tool_" + tool_id + "_toolbonus_base"] === "(@{pb})") {update["repeating_tool_" + tool_id + "_toolbonus"] = mod + "+" + v.pb}
				else if(v["repeating_tool_" + tool_id + "_toolbonus_base"] === "(@{pb}*2)") {update["repeating_tool_" + tool_id + "_toolbonus"] = mod + "+2" + v.pb}
				else if(v["repeating_tool_" + tool_id + "_toolbonus_base"] === "(floor(@{pb}/2))") {update["repeating_tool_" + tool_id + "_toolbonus"] = mod + "+" + v.jack};
			}
			else if(v["repeating_tool_" + tool_id + "_toolattr_base"] && v["repeating_tool_" + tool_id + "_toolattr_base"].substring(0,2) === "?{") {
				if(v["repeating_tool_" + tool_id + "_toolbonus_base"] === "(@{pb})") {update["repeating_tool_" + tool_id + "_toolbonus"] = mod + "+" + parseInt(v.pb, 10)}
				else if(v["repeating_tool_" + tool_id + "_toolbonus_base"] === "(@{pb}*2)") {update["repeating_tool_" + tool_id + "_toolbonus"] = mod + "+" + (parseInt(v.pb, 10)*2)}
				else if(v["repeating_tool_" + tool_id + "_toolbonus_base"] === "(floor(@{pb}/2))") {update["repeating_tool_" + tool_id + "_toolbonus"] = mod + "+" + parseInt(v.jack, 10)};
			}
			else {
				if(v["repeating_tool_" + tool_id + "_toolbonus_base"] === "(@{pb})") {update["repeating_tool_" + tool_id + "_toolbonus"] = mod + parseInt(v.pb, 10)}
				else if(v["repeating_tool_" + tool_id + "_toolbonus_base"] === "(@{pb}*2)") {update["repeating_tool_" + tool_id + "_toolbonus"] = mod + (parseInt(v.pb, 10)*2)}
				else if(v["repeating_tool_" + tool_id + "_toolbonus_base"] === "(floor(@{pb}/2))") {update["repeating_tool_" + tool_id + "_toolbonus"] = mod + parseInt(v.jack, 10)};
			};

			if(query) {
				update["repeating_tool_" + tool_id + "_toolbonus_display"] = "?";
			}
			else {
				update["repeating_tool_" + tool_id + "_toolbonus_display"] = update["repeating_tool_" + tool_id + "_toolbonus"];
			};

		});

		setAttrs(update, {silent: true});
	});
};

var get_repeating_data = function(callback) {
	var getallrepeating = function(getobj, thiscallback, attrlist) {
		attrlist = attrlist || [];
		var thisget = getobj.pop();
		getSectionIDs(thisget.name, function(ids) {
			_.each(ids, function(sectionId) {
				_.each(thisget.list, function(attr) {
					attrlist.push("repeating_" + thisget.name + "_" + sectionId + "_" + attr);
				});
			});
			if(getobj.length > 0) {
				getallrepeating(getobj, thiscallback, attrlist);
			} else {
				getAttrs(attrlist, function(vals) {
					thiscallback(vals);
				});
			};
		});
	};
	var getList = [
		{name: "proficiencies", list: ["name"]},
		{name: "tool", list: ["toolname", "toolattr_base"]},
		{name: "traits", list: ["name", "source", "source_type"]},
		{name: "resource", list: ["resource_left_name", "resource_right_name"]},
		{name: "spell-cantrip", list: ["spellname", "spellattackid", "spellsource", "spellattackid"]},
		{name: "savemod", list: ["global_save_name"]},
		{name: "tohitmod", list: ["global_attack_name"]},
		{name: "damagemod", list: ["global_damage_name"]},
		{name: "acmod", list: ["global_ac_name"]},
		{name: "skillmod", list: ["global_skill_name"]},
		{name: "attack", list: ["atkname", "spellid"]},
		{name: "hpmod", list: ["levels", "source", "mod"]}
	];
	for(var x=1; x<=9; x++) {
		getList.push({ name: "spell-" + x, list: ["spellname", "spellattackid", "spellsource", "spellattackid"] });
	}
	var repeating = {prof_names: [], traits: []};
	_.each(getList, function(section) {
		if(!["proficiencies", "traits"].includes(section.name)) {
			repeating[section.name] = {};
		}
	});
	getallrepeating(getList, function(vals) {
		var traitstemp = {};
		_.each(vals, function(value, name) {
			if(name.split("_")[1] == "proficiencies") {
				repeating.prof_names.push(value.toLowerCase());
			} else if(name.split("_")[1] == "tool") {
				repeating.tool[name.split("_")[2]] = repeating.tool[name.split("_")[2]] || {};
				let attr = _.last(name.split("_"));
				repeating.tool[name.split("_")[2]][attr] = value.toLowerCase();
				if(attr == "toolname") repeating.prof_names.push(value.toLowerCase());
			} else if (name.split("_")[1] == "traits") {
				traitstemp[name.split("_")[2]] = traitstemp[name.split("_")[2]] ? traitstemp[name.split("_")[2]] : {};
				traitstemp[name.split("_")[2]][_.last(name.split("_"))] = value;
			} else if (name.split("_")[1] == "resource") {
				repeating.resource[name.split("_")[2]] = repeating.resource[name.split("_")[2]] || {};
				repeating.resource[name.split("_")[2]][name.split("_")[4]] = value;
			} else if (name.split("_")[1] == "hpmod") {
				repeating.hpmod[name.split("_")[2]] = repeating.hpmod[name.split("_")[2]] || {};
				repeating.hpmod[name.split("_")[2]][name.split("_")[3]] = value;
			} else if (name.split("_")[1].split("-")[0] == "spell") {
				repeating[name.split("_")[1]][name.split("_")[2]] = repeating[name.split("_")[1]][name.split("_")[2]] || {};
				repeating[name.split("_")[1]][name.split("_")[2]][name.split("_")[3]] = value;
			} else if (name.split("_")[1] == "attack") {
				repeating[name.split("_")[1]][name.split("_")[2]] = repeating[name.split("_")[1]][name.split("_")[2]] || {};
				repeating[name.split("_")[1]][name.split("_")[2]][name.split("_")[3]] = value;
			} else {
				repeating[name.split("_")[1]][name.split("_")[2]] = value;
			}
		});
		_.each(traitstemp, function(v, k) {
			var trait = _.clone(v);
			trait.id = k;
			repeating.traits.push(trait);
		});
		callback(repeating);
	});
};

var handle_drop = function(category, eventinfo) {

	getAttrs(["speed", "drop_name", "drop_data", "drop_content", "character_id", "npc_legendary_actions", "strength_mod", "dexterity_mod", "npc", "base_level", "strength_base", "dexterity_base", "constitution_base", "wisdom_base", "intelligence_base", "charisma_base", "class_resource_name", "other_resource_name", "multiclass1_lvl", "multiclass2_lvl", "multiclass3_lvl"], function(v) {
		var pagedata = {};
		try {
			pagedata = JSON.parse(v.drop_data);
		} catch(e) {
			pagedata = v.drop_data;
		}
		var page = {
			name: v.drop_name,
			data: pagedata,
			content: v.drop_content
		};
		var category = page.data["Category"];
		get_repeating_data(function(repeating) {
			var results = processDrop(page, v, repeating);
			setAttrs(results.update, {silent: true}, function() {results.callbacks.forEach(function(callback) {callback(); })} );
		});

	});

};

var processDrop = function(page, currentData, repeating, looped) {
	var jsonparse = function(data) {
		var result = {};
		try {
			result = JSON.parse(data);
		} catch(e) {
			result = data;
		}
		return result;
	};
	var modStringToAttrib = function(modString) {
		var finalAttrib = "";
		if (modString == "FIN") {
			if (parseInt(currentData.strength_base) > parseInt(currentData.dexterity_base)) {
				finalAttrib = "@{strength_mod}";
			} else {
				finalAttrib = "@{dexterity_mod}";
			}
		} else {
			switch(modString) {
				case "STR":
					finalAttrib = "@{strength_mod}";
					break;
				case "DEX":
					finalAttrib = "@{dexterity_mod}";
					break;
				case "CON":
					finalAttrib = "@{constitution_mod}";
					break;
				case "WIS":
					finalAttrib = "@{wisdom_mod}";
					break;
				case "INT":
					finalAttrib = "@{intelligence_mod}";
					break;
				case "CHA":
					finalAttrib = "@{charisma_mod}";
					break;
			}
		}
		return finalAttrib;
	};
	var numUses = function(uses_string) {
		uses_string = parseValues(uses_string);

		var terms = uses_string.split("+");
		var total = 0;
		_.each(terms, function(term) {
			total += parseInt(term);
		});
		return uses_string === "" || uses_string === "-" ? uses_string : total;
	};
	var parseValues = function(uses_string) {
		var attribs = ["strength", "dexterity", "constitution", "wisdom", "intelligence", "charisma"];
		uses_string = uses_string ? uses_string.toLowerCase() : "";
		_.each(attribs, function(attrib) {
			var attribMod = Math.floor((parseInt(currentData[attrib + "_base"]) - 10) / 2);
			if (attribMod < 0 || isNaN(attribMod)) attribMod = 0;
			uses_string = uses_string.replace(attrib, attribMod);
		});
		uses_string = uses_string.replace(/half_level/g, Math.floor(classlevel/2));
		return uses_string.replace(/level/g, classlevel);
	};
	var category = page.data["Category"];
	var callbacks = [];
	var update = {};
	var id = generateRowID();
	var blobs = {};
	var classlevel = currentData.base_level ? parseInt(currentData.base_level) : 1;
	repeating.traits = repeating.traits ? repeating.traits : [];
	update["drop_category"] = "";
	update["drop_name"] = "";
	update["drop_data"] = "";
	update["drop_content"] = "";
	if(category === "Items") {
		if(currentData.npc === "0") {
			update["tab"] = "equipment";
			if(page.name) {update["repeating_inventory_" + id + "_itemname"] = page.name};
			if(page.data["itemcount"]) {update["repeating_inventory_" + id + "_itemcount"] = page.data["itemcount"]};
			if(page.data["Weight"]) {update["repeating_inventory_" + id + "_itemweight"] = page.data["Weight"]};
			if(page.data["Properties"]) {update["repeating_inventory_" + id + "_itemproperties"] = page.data["Properties"]};
			if(page.content) {update["repeating_inventory_" + id + "_itemcontent"] = page.content};
			if(!page.data["Item Type"] || page.data["Item Type"] == "") {page.data["Item Type"] = category};
			var mods = "Item Type: " + page.data["Item Type"];
			if(page.data["AC"] && page.data["AC"] != "") {
				mods += ", AC: " + page.data["AC"];
				if(!looped) {
					callbacks.push( function() {update_ac();} )
				}
			};
			if(page.data["Damage"] && page.data["Damage"] != "") {mods += ", Damage: " + page.data["Damage"]};
			if(page.data["Damage Type"] && page.data["Damage Type"] != "") {mods += ", Damage Type: " + page.data["Damage Type"]};
			if(page.data["Secondary Damage"] && page.data["Secondary Damage"] != "") {mods += ", Secondary Damage: " + page.data["Secondary Damage"]};
			if(page.data["Secondary Damage Type"] && page.data["Secondary Damage Type"] != "") {mods += ", Secondary Damage Type: " + page.data["Secondary Damage Type"]};
			if(page.data["Alternate Damage"] && page.data["Alternate Damage"] != "") {mods += ", Alternate Damage: " + page.data["Alternate Damage"]};
			if(page.data["Alternate Damage Type"] && page.data["Alternate Damage Type"] != "") {mods += ", Alternate Damage Type: " + page.data["Alternate Damage Type"]};
			if(page.data["Alternate Secondary Damage"] && page.data["Alternate Secondary Damage"] != "") {mods += ", Alternate Secondary Damage: " + page.data["Alternate Secondary Damage"]};
			if(page.data["Alternate Secondary Damage Type"] && page.data["Alternate Secondary Damage Type"] != "") {mods += ", Alternate Secondary Damage Type: " + page.data["Alternate Secondary Damage Type"]};
			if(page.data["Range"] && page.data["Range"] != "") {mods += ", Range: " + page.data["Range"]};
			if(page.data["Modifiers"] && page.data["Modifiers"] != "") {mods += ", " + page.data["Modifiers"]};
			update["repeating_inventory_" + id + "_itemmodifiers"] = mods;
			if(page.data["Item Type"].indexOf("Weapon") > -1) {
				update["repeating_inventory_" + id + "_hasattack"] = 1;
				callbacks.push( function() {
					if(page.data["Alternate Damage"] && page.data["Alternate Damage"] !== "") {
						create_attack_from_item(id, {versatile: true});
					} else {
						create_attack_from_item(id);
					}
				} );
			}
			else if(page.data["Item Type"].indexOf("Ammunition") > -1) {
				update["repeating_inventory_" + id + "_useasresource"] = 1;
				callbacks.push( function() {create_resource_from_item(id);} );
			};
			if(page.data["Modifiers"]) {
				callbacks.push( function() {check_itemmodifiers(page.data["Modifiers"]);} );
			};
			if(!looped) {
				callbacks.push( function() {update_weight();} );
			}
		}
		else {
			if(page.data["Item Type"] && new RegExp('\\bweapon\\b', 'i').test(page.data["Item Type"])) {
				var make_npc_attack_from_item = function(rowid, options) {
					update["repeating_npcaction_" + rowid + "_npc_options-flag"] = "0";
					update["repeating_npcaction_" + rowid + "_attack_flag"] = "on";

					if(page.name) {
						update["repeating_npcaction_" + rowid + "_name"] = page.name;
						if(options && options.versatile) {
							update["repeating_npcaction_" + rowid + "_name"] += " (" + (options.versatile === 1 ? "One-Handed" : "Two-Handed") + ")";
						} else if(options && options.thrown) {
							update["repeating_npcaction_" + rowid + "_name"] += " (Thrown)";
						}
					}
					if(page.content) { update["repeating_npcaction_" + rowid + "_description"] = page.content; }

					update["repeating_npcaction_" + rowid + "_attack_display_flag"] = "{{attack=1}}";
					update["repeating_npcaction_" + rowid + "_attack_options"] = "{{attack=1}}";
					update["repeating_npcaction_" + rowid + "_attack_type"] = page.data["Item Type"].substring(0, page.data["Item Type"].indexOf(" "));

					var thrown = page.data["Properties"] && new RegExp('\\bthrown\\b', 'i').test(page.data["Properties"]);

					if(page.data["Range"] && page.data["Range"] != "" && (!thrown || (options && options.thrown))) {
						update["repeating_npcaction_" + rowid + "_attack_range"] = page.data["Range"];
					}
					else if(page.data["Properties"] && new RegExp('\\breach\\b', 'i').test(page.data["Properties"])) {
						update["repeating_npcaction_" + rowid + "_attack_range"] = "10 ft";
					}
					else {
						update["repeating_npcaction_" + rowid + "_attack_range"] = "5 ft";
					}

					update["repeating_npcaction_" + rowid + "_attack_target"] = "one target";

					var isFinesse = page.data["Properties"] && new RegExp('\\bfinesse\\b', 'i').test(page.data["Properties"]);
					var attack_type = update[`repeating_npcaction_${id}_attack_type`].toLowerCase();
					var use_dex_mod = attack_type === "ranged" || (isFinesse && currentData.dexterity_mod > currentData.strength_mod);
					var weapon_attr_mod = use_dex_mod ? currentData.dexterity_mod : currentData.strength_mod;
					update["repeating_npcaction_" + rowid + "_attack_tohit"] = weapon_attr_mod;

					if(options && options.versatile === 2) {
						if(page.data["Alternate Damage"]) { update["repeating_npcaction_" + rowid + "_attack_damage"] = page.data["Alternate Damage"] + "+" + weapon_attr_mod; }
						if(page.data["Alternate Damage Type"]) { update["repeating_npcaction_" + rowid + "_attack_damagetype"] = page.data["Alternate Damage Type"]; }
						if(page.data["Alternate Secondary Damage"]) { update["repeating_npcaction_" + rowid + "_attack_damage2"] = page.data["Alternate Secondary Damage"]; }
						if(page.data["Alternate Secondary Damage Type"]) { update["repeating_npcaction_" + rowid + "_attack_damagetype2"] = page.data["Alternate Secondary Damage Type"]; }
					}
					else {
						if(page.data["Damage"]) { update["repeating_npcaction_" + rowid + "_attack_damage"] = page.data["Damage"] + "+" + weapon_attr_mod; }
						if(page.data["Damage Type"]) {update["repeating_npcaction_" + rowid + "_attack_damagetype"] = page.data["Damage Type"]; }
						if(page.data["Secondary Damage"]) { update["repeating_npcaction_" + rowid + "_attack_damage2"] = page.data["Secondary Damage"]; }
						if(page.data["Secondary Damage Type"]) { update["repeating_npcaction_" + rowid + "_attack_damagetype2"] = page.data["Secondary Damage Type"]; }
					}

					if(page.data["Modifiers"]) {
						if(attack_type === "melee") {
							var tohit_regex = /(?:melee|weapon) *attacks? *([\\+\\-] *[0-9]+)/i;
							var melee_damage_regex = /(?:melee|weapon) *damage *([\\+\\-] *[0-9]+)/i;
							var tohit_match = tohit_regex.exec(page.data["Modifiers"]);
							var damage_match = melee_damage_regex.exec(page.data["Modifiers"]);

							if(tohit_match && tohit_match[1]) { update[`repeating_npcaction_${rowid}_attack_tohit`] = +update[`repeating_npcaction_${rowid}_attack_tohit`] + +tohit_match[1]; }
							if(page.data["Damage"] && damage_match && damage_match[1]) { update[`repeating_npcaction_${rowid}_attack_damage`] += damage_match[1]; }
						} else if(attack_type === "ranged") {
							var tohit_regex = /(?:ranged|weapon) *attacks? *([\\+\\-] *[0-9]+)/i;
							var ranged_damage_regex = /(?:ranged|weapon) *damage *([\\+\\-] *[0-9]+)/i;
							var tohit_match = tohit_regex.exec(page.data["Modifiers"]);
							var damage_match = ranged_damage_regex.exec(page.data["Modifiers"]);

							if(tohit_match && tohit_match[1]) { update[`repeating_npcaction_${rowid}_attack_tohit`] = +update[`repeating_npcaction_${rowid}_attack_tohit`] + +tohit_match[1]; }
							if(page.data["Damage"] && damage_match && damage_match[1]) { update[`repeating_npcaction_${rowid}_attack_damage`] += damage_match[1]; }
						}
					}
				};

				var versatile = page.data["Properties"] && new RegExp('\\bversatile\\b', 'i').test(page.data["Properties"]) ? 1 : undefined;
				make_npc_attack_from_item(id, {versatile: versatile});
				if(page.data["Properties"] && new RegExp('\\bthrown\\b', 'i').test(page.data["Properties"])) {
					make_npc_attack_from_item(generateRowID(), {thrown: true});
				}
				if(versatile && page.data["Alternate Damage"]) {
					make_npc_attack_from_item(generateRowID(), {versatile:2})
				}

				callbacks.push(function() { check_itemmodifiers(page.data["Modifiers"]); }, function() { update_npc_action("all"); });
			}
		}
	};
	if(category === "Spells") {
		let existing = {};
		var lvl = page.data["Level"] && page.data["Level"] > 0 ? page.data["Level"] : "cantrip";
		if(repeating["spell-" + lvl]) {
			_.each(repeating["spell-" + lvl], function(spell, spellid) {
				if(spell.spellname.toLowerCase() === page.name.toLowerCase()) {
					id = spellid;
					existing = spell;
				}
			});
		}
		update["repeating_spell-" + lvl + "_" + id + "_spelllevel"] = lvl;
		if(page.data["spellcasting_ability"]) {
			update["repeating_spell-" + lvl + "_" + id + "_spell_ability"] = "@{" + page.data["spellcasting_ability"].toLowerCase() + "_mod}+";
		} else {
			update["repeating_spell-" + lvl + "_" + id + "_spell_ability"] = "spell";
		}
		if(page.data["spellclass"]) {
			update["repeating_spell-" + lvl + "_" + id + "_spellclass"] = page.data["spellclass"];
		}
		if(page.data["spellsource"]) {
			update["repeating_spell-" + lvl + "_" + id + "_spellsource"] = page.data["spellsource"];
		}
		if(page.name) {update["repeating_spell-" + lvl + "_" + id + "_spellname"] = page.name};
		if(page.data["Ritual"]) {update["repeating_spell-" + lvl + "_" + id + "_spellritual"] = "{{ritual=1}}"};
		if(page.data["School"]) {update["repeating_spell-" + lvl + "_" + id + "_spellschool"] = page.data["School"].toLowerCase()};
		if(page.data["Casting Time"]) {update["repeating_spell-" + lvl + "_" + id + "_spellcastingtime"] = page.data["Casting Time"]};
		if(page.data["Range"]) {update["repeating_spell-" + lvl + "_" + id + "_spellrange"] = page.data["Range"]};
		if(page.data["Target"]) {update["repeating_spell-" + lvl + "_" + id + "_spelltarget"] = page.data["Target"]};
		if(page.data["Components"]) {
			if(page.data["Components"].toLowerCase().indexOf("v") === -1) {update["repeating_spell-" + lvl + "_" + id + "_spellcomp_v"] = "0"};
			if(page.data["Components"].toLowerCase().indexOf("s") === -1) {update["repeating_spell-" + lvl + "_" + id + "_spellcomp_s"] = "0"};
			if(page.data["Components"].toLowerCase().indexOf("m") === -1) {update["repeating_spell-" + lvl + "_" + id + "_spellcomp_m"] = "0"};
		};
		if(page.data["Material"]) {update["repeating_spell-" + lvl + "_" + id + "_spellcomp_materials"] = page.data["Material"]};
		if(page.data["Concentration"]) {update["repeating_spell-" + lvl + "_" + id + "_spellconcentration"] = "{{concentration=1}}"};
		if(page.data["Duration"]) {update["repeating_spell-" + lvl + "_" + id + "_spellduration"] = page.data["Duration"]};
		if(page.data["Damage"] || page.data["Healing"]) {
			update["repeating_spell-" + lvl + "_" + id + "_spelloutput"] = "ATTACK";
			if(!existing.spellattackid) callbacks.push( function() {create_attack_from_spell(lvl, id, currentData.character_id);} );
		}
		else if(page.data["Higher Spell Slot Desc"] && page.data["Higher Spell Slot Desc"] != "") {
			var spelllevel = "?{Cast at what level?";
			for(i = 0; i < 10-lvl; i++) {
				spelllevel = spelllevel + "|Level " + (parseInt(i, 10) + parseInt(lvl, 10)) + "," + (parseInt(i, 10) + parseInt(lvl, 10));
			}
			spelllevel = spelllevel + "}";
			update["repeating_spell-" + lvl + "_" + id + "_rollcontent"] = "@{wtype}&{template:spell} {{level=@{spellschool} " + spelllevel + "}} {{name=@{spellname}}} {{castingtime=@{spellcastingtime}}} {{range=@{spellrange}}} {{target=@{spelltarget}}} @{spellcomp_v} @{spellcomp_s} @{spellcomp_m} {{material=@{spellcomp_materials}}} {{duration=@{spellduration}}} {{description=@{spelldescription}}} {{athigherlevels=@{spellathigherlevels}}} @{spellritual} {{innate=@{innate}}} @{spellconcentration} @{charname_output}";
		};
		if(page.data["Spell Attack"]) {update["repeating_spell-" + lvl + "_" + id + "_spellattack"] = page.data["Spell Attack"]};
		if(page.data["Damage"]) {update["repeating_spell-" + lvl + "_" + id + "_spelldamage"] = page.data["Damage"]};
		if(page.data["Damage Type"]) {update["repeating_spell-" + lvl + "_" + id + "_spelldamagetype"] = page.data["Damage Type"]};
		if(page.data["Secondary Damage"]) {update["repeating_spell-" + lvl + "_" + id + "_spelldamage2"] = page.data["Secondary Damage"]};
		if(page.data["Secondary Damage Type"]) {update["repeating_spell-" + lvl + "_" + id + "_spelldamagetype2"] = page.data["Secondary Damage Type"]};
		if(page.data["Healing"]) {update["repeating_spell-" + lvl + "_" + id + "_spellhealing"] = page.data["Healing"];};
		if(page.data["Add Casting Modifier"]) {update["repeating_spell-" + lvl + "_" + id + "_spelldmgmod"] = page.data["Add Casting Modifier"]};
		if(page.data["Save"]) {update["repeating_spell-" + lvl + "_" + id + "_spellsave"] = page.data["Save"]};
		if(page.data["Save Success"]) {update["repeating_spell-" + lvl + "_" + id + "_spellsavesuccess"] = page.data["Save Success"]};
		if(page.data["Higher Spell Slot Dice"]) {update["repeating_spell-" + lvl + "_" + id + "_spellhldie"] = page.data["Higher Spell Slot Dice"]};
		if(page.data["Higher Spell Slot Die"]) {update["repeating_spell-" + lvl + "_" + id + "_spellhldietype"] = page.data["Higher Spell Slot Die"]};
		if(page.data["Higher Spell Slot Bonus"]) {update["repeating_spell-" + lvl + "_" + id + "_spellhlbonus"] = page.data["Higher Spell Slot Bonus"]};
		if(page.data["Higher Spell Slot Desc"]) {update["repeating_spell-" + lvl + "_" + id + "_spellathigherlevels"] = page.data["Higher Spell Slot Desc"]};
		if(page.data["data-Cantrip Scaling"] && lvl == "cantrip") {update["repeating_spell-" + lvl + "_" + id + "_spell_damage_progression"] = "Cantrip " + page.data["data-Cantrip Scaling"].charAt(0).toUpperCase() + page.data["data-Cantrip Scaling"].slice(1);};
		if(page.data["data-description"]) { update["repeating_spell-" + lvl + "_" + id + "_spelldescription"] = page.data["data-description"]};
		update["repeating_spell-" + lvl + "_" + id + "_options-flag"] = "0";
	};
	if(category === "Monsters") {
		update["npc"] = "1";
		update["npc_options-flag"] = "0";
		if(page.name && page.name != "") {update["npc_name"] = page.name};
		update["npc_speed"] = page.data["Speed"] ? page.data["Speed"] : "";
		update["strength_base"] = page.data["STR"] ?	page.data["STR"] : "";
		update["dexterity_base"] = page.data["DEX"] ? page.data["DEX"] : "";
		update["constitution_base"] = page.data["CON"] ? page.data["CON"] : "";
		update["intelligence_base"] = page.data["INT"] ? page.data["INT"] : "";
		update["wisdom_base"] = page.data["WIS"] ? page.data["WIS"] : "";
		update["charisma_base"] = page.data["CHA"] ? page.data["CHA"] : "";
		callbacks.push( function() {update_attr("strength");} );
		callbacks.push( function() {update_attr("dexterity");} );
		callbacks.push( function() {update_attr("constitution");} );
		callbacks.push( function() {update_attr("intelligence");} );
		callbacks.push( function() {update_attr("wisdom");} );
		callbacks.push( function() {update_attr("charisma");} );
		update["npc_vulnerabilities"] = page.data["Vulnerabilities"] ? page.data["Vulnerabilities"] : "";
		update["npc_resistances"] = page.data["Resistances"] ? page.data["Resistances"] : "";
		update["npc_immunities"] = page.data["Immunities"] ? page.data["Immunities"] : "";
		update["npc_condition_immunities"] = page.data["Condition Immunities"] ? page.data["Condition Immunities"] : "";
		update["npc_languages"] = page.data["Languages"] ? page.data["Languages"] : "";
		update["token_size"] = page.data["Token Size"] ? page.data["Token Size"] : "";
		if(page.data["Challenge Rating"] && page.data["Challenge Rating"] != "") {
			callbacks.push( function() {update_challenge();} );
			update["npc_challenge"] = page.data["Challenge Rating"];
		}
		else {
			update["npc_challenge"] = "";
		}
		if(page.data["data-XP"]) {
			update["npc_xp"] = page.data["data-XP"].toString().replace(",","");
		}

		var type = "";
		if(page.data["Size"]) {type = page.data["Size"]};
		if(page.data["Type"]) {
			if(type.length > 0) {
				type = type + " " + page.data["Type"].toLowerCase();
			}
			else {
				type = page.data["Type"].toLowerCase();
			}
		};
		if(page.data["Alignment"]) {
			if(type.length > 0) {
				type = type + ", " + page.data["Alignment"];
			}
			else {
				type = page.data["Alignment"];
			}
		};
		update["npc_type"] = type;

		if(page.data["HP"]) {
			if(page.data["HP"].toString().indexOf("(") > -1) {
				update["hp_max"] = page.data["HP"].toString().split(" (")[0];
				update["npc_hpformula"] = page.data["HP"].toString().split(" (")[1].slice(0, -1);
			}
			else {
				update["hp_max"] = page.data["HP"]
				update["npc_hpformula"] = ""
			};
		}
		else {
			update["hp_max"] = ""
			update["npc_hpformula"] = ""
		};

		if(page.data["AC"]) {
			if(page.data["AC"].toString().indexOf("(") > -1) {
				update["npc_ac"] = page.data["AC"].toString().split(" (")[0];
				update["npc_actype"] = page.data["AC"].toString().split(" (")[1].slice(0, -1);
			}
			else {
				update["npc_ac"] = page.data["AC"];
				update["npc_actype"] = "";
			};
		}
		else {
			update["npc_ac"] = "";
			update["npc_actype"] = "";
		};

		var senses = page.data["Senses"] ? page.data["Senses"] : "";
		if(page.data["Passive Perception"]) {
			if(senses.length > 0) {
				senses = senses + ", passive Perception " + page.data["Passive Perception"];
			}
			else {
				senses = "passive Perception " + page.data["Passive Perception"];
			}
		}
		update["npc_senses"] = senses;

		update["npc_str_save_base"] = "";
		update["npc_dex_save_base"] = "";
		update["npc_con_save_base"] = "";
		update["npc_int_save_base"] = "";
		update["npc_wis_save_base"] = "";
		update["npc_cha_save_base"] = "";
		if(page.data["Saving Throws"] && page.data["Saving Throws"] != "") {
			var savearray = page.data["Saving Throws"].split(", ");
			_.each(savearray, function(save) {
				kv = save.indexOf("-") > -1 ? save.split(" ") : save.split(" +");
				update["npc_" + kv[0].toLowerCase() + "_save_base"] = parseInt(kv[1], 10);
			});
			callbacks.push( function() {update_npc_saves();} );
		};

		update["npc_acrobatics_base"] = "";
		update["npc_animal_handling_base"] = "";
		update["npc_arcana_base"] = "";
		update["npc_athletics_base"] = "";
		update["npc_deception_base"] = "";
		update["npc_history_base"] = "";
		update["npc_insight_base"] = "";
		update["npc_intimidation_base"] = "";
		update["npc_investigation_base"] = "";
		update["npc_medicine_base"] = "";
		update["npc_nature_base"] = "";
		update["npc_perception_base"] = "";
		update["npc_performance_base"] = "";
		update["npc_persuasion_base"] = "";
		update["npc_religion_base"] = "";
		update["npc_sleight_of_hand_base"] = "";
		update["npc_stealth_base"] = "";
		update["npc_survival_base"] = "";
		if(page.data["Skills"] && page.data["Skills"] != "") {
			skillarray = page.data["Skills"].split(", ");
			_.each(skillarray, function(skill) {
				kv = skill.indexOf("-") > -1 ? skill.split(" ") : skill.split(" +");
				update["npc_" + kv[0].toLowerCase().replace(/ /g, '_') + "_base"] = parseInt(kv[1], 10);
			});
			callbacks.push( function() {update_npc_skills();} );
		}

		getSectionIDs("repeating_npcaction-l", function(idarray) {
			_.each(idarray, function(currentID, i) {
				removeRepeatingRow("repeating_npcaction-l_" + currentID);
			});
		});
		getSectionIDs("repeating_npcreaction", function(idarray) {
			_.each(idarray, function(currentID, i) {
				removeRepeatingRow("repeating_npcreaction_" + currentID);
			});
		});
		getSectionIDs("repeating_npcaction", function(idarray) {
			_.each(idarray, function(currentID, i) {
				removeRepeatingRow("repeating_npcaction_" + currentID);
			});
		});
		getSectionIDs("repeating_npctrait", function(idarray) {
			_.each(idarray, function(currentID, i) {
				removeRepeatingRow("repeating_npctrait_" + currentID);
			});
		});

		var contentarray = page.content;
		if(page.data["data-Legendary Actions"]) {
			var legendaryactionsarray = jsonparse(page.data["data-Legendary Actions"]);
			update["npc_legendary_actions"] = 1;
			if(page.data["Legendary Actions Desc"]) {
				update["npc_legendary_actions_desc"] = page.data["Legendary Actions Desc"];
			}
			else if(currentData.npc_legendary_actions > 0){
				update["npc_legendary_actions_desc"] = `The ${page.name} can take ${currentData.npc_legendary_actions}, choosing from the options below. Only one legendary option can be used at a time and only at the end of another creature's turn. The ${page.name} regains spent legendary actions at the start of its turn.`;
			}
			else {
				update["npc_legendary_actions_desc"] = "";
			}
		}
		else if(contentarray && contentarray.indexOf("Legendary Actions") > -1) {
			if(contentarray.indexOf(/\n Legendary Actions\n/) > -1) {
				temp = contentarray.split(/\n Legendary Actions\n/)
			}
			else {
				temp = contentarray.split(/Legendary Actions\n/)
			}
			var legendaryactionsarray = temp[1];
			contentarray = temp[0];
		}

		if(page.data["data-Reactions"]) {
			var reactionsarray = jsonparse(page.data["data-Reactions"]);
		}
		else if(contentarray && contentarray.indexOf("Reactions") > -1) {
			if(contentarray.indexOf(/\n Reactions\n/) > -1) {
				temp = contentarray.split(/\n Reactions\n/)
			}
			else {
				temp = contentarray.split(/Reactions\n/)
			}
			var reactionsarray = temp[1];
			contentarray = temp[0];
		}

		if(page.data["data-Actions"]) {
			var actionsarray = jsonparse(page.data["data-Actions"]);
		}
		else if(contentarray && contentarray.indexOf("Actions") > -1) {
			if(contentarray.indexOf("Lair Actions") > -1) {
				contentarray = contentarray.replace("Lair Actions","Lair Action");
			}
			if(contentarray.indexOf(/\n Actions\n/) > -1) {
				temp = contentarray.split(/\n Actions\n/)
			}
			else {
				temp = contentarray.split(/Actions\n/)
			}
			var actionsarray = temp[1];
			contentarray = temp[0];
		}

		if(page.data["data-Traits"]) {
			var traitsarray = jsonparse(page.data["data-Traits"]);
		}
		else if(contentarray && contentarray.indexOf("Traits") > -1) {
			if(contentarray.indexOf("Lair Traits") > -1) {
				contentarray = contentarray.replace("Lair Traits","Lair Trait");
			}
			if(contentarray.indexOf(/\n Traits\n/) > -1) {
				temp = contentarray.split(/\n Traits\n/)
			}
			else {
				temp = contentarray.split(/Traits\n/)
			}
			var traitsarray = temp[1];
			contentarray = temp[0];
		}

		if(traitsarray) {
			if(page.data["data-Traits"]) {
				var traitsobj = {};
				traitsarray.forEach(function(val) { traitsobj[val.Name] = val.Desc; });
			}
			else {
				traitsarray = traitsarray.split("**");
				traitsarray.shift();
				var traitsobj = {};
				traitsarray.forEach(function(val, i) {
					if (i % 2 === 1) return;
					traitsobj[val] = traitsarray[i + 1];
				});
			}
			_.each(traitsobj, function(desc, name) {
				newrowid = generateRowID();
				update["repeating_npctrait_" + newrowid + "_name"] = name + ".";
				if(desc.substring(0,2) === ": " || encodeURI(desc.substring(0,2)) === ":%C2%A0") {
					desc = desc.substring(2);
				}
				update["repeating_npctrait_" + newrowid + "_desc"] = desc.trim();
				// SPELLCASTING NPCS
				if(name === "Spellcasting") {
					var lvl = parseInt(desc.substring(desc.indexOf("-level")-4, desc.indexOf("-level")-2).trim(), 10);
					lvl = !isNaN(lvl) ? lvl : 1;
					var ability = desc.match(/casting ability is (.*?) /);
					ability = ability && ability.length > 1 ? ability[1] : false;
					ability = ability ? "@{" + ability.toLowerCase() + "_mod}+" : "0*";
					update["npcspellcastingflag"] = 1;
					update["spellcasting_ability"] = ability;
					update["caster_level"] = lvl;
					update["class"] = "Wizard";
					update["base_level"] = lvl;
					update["level"] = lvl;
					callbacks.push( function() {update_pb();} );
					callbacks.push( function() {update_spell_slots();} );
				}
			});
		}
		if(actionsarray) {
			if(page.data["data-Actions"]) {
				var actionsobj = {};
				actionsarray.forEach(function(val) { actionsobj[val.Name] = val; });

				_.each(actionsobj, function(action, name) {
					newrowid = generateRowID();
					update["repeating_npcaction_" + newrowid + "_npc_options-flag"] = "0";
					update["repeating_npcaction_" + newrowid + "_name"] = name;
					if(action["Desc"]) {
						update["repeating_npcaction_" + newrowid + "_description"] = action["Desc"];
					}

					if(action["Type Attack"]) {
						update["repeating_npcaction_" + newrowid + "_attack_flag"] = "on";
						update["repeating_npcaction_" + newrowid + "_attack_display_flag"] = "{{attack=1}}";
						update["repeating_npcaction_" + newrowid + "_attack_options"] = "{{attack=1}}";
						if(action["Type"]) { update["repeating_npcaction_" + newrowid + "_attack_type"] = action["Type"]; }
						if(action["Reach"]) { update["repeating_npcaction_" + newrowid + "_attack_range"] = action["Reach"]; }
						if(action["Hit Bonus"]) { update["repeating_npcaction_" + newrowid + "_attack_tohit"] = action["Hit Bonus"]; }
						if(action["Target"]) { update["repeating_npcaction_" + newrowid + "_attack_target"] = action["Target"]; }
						if(action["Damage"]) { update["repeating_npcaction_" + newrowid + "_attack_damage"] = action["Damage"]; }
						if(action["Damage Type"]) { update["repeating_npcaction_" + newrowid + "_attack_damagetype"] = action["Damage Type"]; }

						if(action["Damage 2"] && action["Damage 2 Type"]) {
							update["repeating_npcaction_" + newrowid + "_attack_damage2"] = action["Damage 2"];
							update["repeating_npcaction_" + newrowid + "_attack_damagetype2"] = action["Damage 2 Type"];
						}
					}
				})
			}
			else {
				actionsarray = actionsarray.split("**");
				actionsarray.shift();
				var actionsobj = {};
				actionsarray.forEach(function(val, i) {
					if (i % 2 === 1) return;
					actionsobj[val] = actionsarray[i + 1];
				});
				_.each(actionsobj, function(desc, name) {
					newrowid = generateRowID();
					update["repeating_npcaction_" + newrowid + "_npc_options-flag"] = "0";
					update["repeating_npcaction_" + newrowid + "_name"] = name;
					if(desc.substring(0,2) === ": " || encodeURI(desc.substring(0,2)) === ":%C2%A0") {
						desc = desc.substring(2);
					}
					if(desc.indexOf(" Attack:") > -1) {
						update["repeating_npcaction_" + newrowid + "_attack_flag"] = "on";
						update["repeating_npcaction_" + newrowid + "_attack_display_flag"] = "{{attack=1}}";
						update["repeating_npcaction_" + newrowid + "_attack_options"] = "{{attack=1}}";
						if(desc.indexOf(" Weapon Attack:") > -1) {
							attacktype = desc.split(" Weapon Attack:")[0];
						}
						else if(desc.indexOf(" Spell Attack:") > -1) {
							attacktype = desc.split(" Spell Attack:")[0];
						}
						else {
							console.log("FAILED TO IMPORT ATTACK - NO ATTACK TYPE FOUND (Weapon Attack/Spell Attack)");
							return;
						}

						update["repeating_npcaction_" + newrowid + "_attack_type"] = attacktype;
						if(attacktype === "Melee") {
							update["repeating_npcaction_" + newrowid + "_attack_range"] = (desc.match(/reach (.*?),/) || ["",""])[1];
						}
						else {
							update["repeating_npcaction_" + newrowid + "_attack_range"] = (desc.match(/range (.*?),/) || ["",""])[1];
						}
						update["repeating_npcaction_" + newrowid + "_attack_tohit"] = (desc.match(/\+(.*) to hit/) || ["",""])[1];
						update["repeating_npcaction_" + newrowid + "_attack_target"] = (desc.match(/\.,(?!.*\.,)(.*)\. Hit:/) || ["",""])[1];
						if(desc.toLowerCase().indexOf("damage") > -1) {
							update["repeating_npcaction_" + newrowid + "_attack_damage"] = (desc.match(/\(([^)]+)\)/) || ["",""])[1];
							update["repeating_npcaction_" + newrowid + "_attack_damagetype"] = (desc.match(/\) (.*?) damage/) || ["",""])[1];
							if((desc.match(/\(/g) || []).length > 1 && desc.match(/\((?!.*\()([^)]+)\)/)) {
								var second_match = desc.match(/\((?!.*\()([^)]+)\)/);
								if(second_match[1] && second_match[1].indexOf(" DC") === -1) {
									update["repeating_npcaction_" + newrowid + "_attack_damage2"] = (desc.match(/\((?!.*\()([^)]+)\)/) || ["",""])[1];
									update["repeating_npcaction_" + newrowid + "_attack_damagetype2"] = (desc.match(/\)(?!.*\)) (.*?) damage/) || ["",""])[1];
								};
							};
							ctest1 = desc.split("damage.")[1];
							ctest2 = desc.split("damage, ")[1];
							if(ctest1 && ctest1.length > 0) {
								update["repeating_npcaction_" + newrowid + "_description"] = ctest1.trim();
							}
							else if(ctest2 && ctest2.length > 0) {
								update["repeating_npcaction_" + newrowid + "_description"] = ctest2.trim();
							}
						}
						else {
							update["repeating_npcaction_" + newrowid + "_description"] = desc.split("Hit:")[1].trim();
						}
					}
					else {
						update["repeating_npcaction_" + newrowid + "_description"] = desc;
					}

				});
			}
			callbacks.push( function() {update_npc_action("all");} );
		}
		if(reactionsarray) {
			update["npcreactionsflag"] = 1;
			if(page.data["data-Reactions"]) {
				var reactionsobj = {};
				reactionsarray.forEach(function(val) { reactionsobj[val.Name] = val.Desc; });
			}
			else {
				reactionsarray = reactionsarray.split("**");
				reactionsarray.shift();
				var reactionsobj = {};
				reactionsarray.forEach(function(val, i) {
					if (i % 2 === 1) return;
					reactionsobj[val] = reactionsarray[i + 1];
				});
			}
			_.each(reactionsobj, function(desc, name) {
				newrowid = generateRowID();
				update["repeating_npcreaction_" + newrowid + "_name"] = name + ".";
				if(desc.substring(0,2) === ": " || encodeURI(desc.substring(0,2)) === ":%C2%A0") {
					desc = desc.substring(2);
				}
				update["repeating_npcreaction_" + newrowid + "_desc"] = desc.trim();
			});
		}
		if(legendaryactionsarray) {
			if(page.data["data-Legendary Actions"]) {
				var actionsobj = {};
				legendaryactionsarray.forEach(function(val) { actionsobj[val.Name] = val; });
				_.each(actionsobj, function(action, name) {
					newrowid = generateRowID();
					update["repeating_npcaction-l_" + newrowid + "_npc_options-flag"] = "0";
					update["repeating_npcaction-l_" + newrowid + "_name"] = name;
					update["repeating_npcaction-l_" + newrowid + "_description"] = action["Desc"];

					if(action["Type Attack"]) {
						update["repeating_npcaction-l_" + newrowid + "_attack_flag"] = "on";
						update["repeating_npcaction-l_" + newrowid + "_attack_display_flag"] = "{{attack=1}}";
						update["repeating_npcaction-l_" + newrowid + "_attack_options"] = "{{attack=1}}";
						update["repeating_npcaction-l_" + newrowid + "_attack_type"] = action["Type Attack"];
						update["repeating_npcaction-l_" + newrowid + "_attack_range"] = action["Reach"];
						update["repeating_npcaction-l_" + newrowid + "_attack_tohit"] = action["Hit Bonus"];
						update["repeating_npcaction-l_" + newrowid + "_attack_target"] = action["Target"];
						update["repeating_npcaction-l_" + newrowid + "_attack_damage"] = action["Damage"];
						update["repeating_npcaction-l_" + newrowid + "_attack_damagetype"] = action["Damage Type"];

						if(action["Damage 2"] && action["Damage 2 Type"]) {
							update["repeating_npcaction-l_" + newrowid + "_attack_damage2"] = action["Damage 2"];
							update["repeating_npcaction-l_" + newrowid + "_attack_damagetype2"] = action["Damage 2 Type"];
						}
					}
				});
			}
			else {
				var numlegendaryactions = (legendaryactionsarray.match(/\d+/) || [""])[0];
				update["npc_legendary_actions"] = numlegendaryactions;
				update["npc_legendary_actions_desc"] = `The ${page.name} can take ${numlegendaryactions}, choosing from the options below. Only one legendary option can be used at a time and only at the end of another creature's turn. The ${page.name} regains spent legendary actions at the start of its turn.`;
				legendaryactionsarray = legendaryactionsarray.split("**");
				legendaryactionsarray.shift();
				var actionsobj = {};
				legendaryactionsarray.forEach(function(val, i) {
					if (i % 2 === 1) return;
					actionsobj[val] = legendaryactionsarray[i + 1];
				});
				_.each(actionsobj, function(desc, name) {
					newrowid = generateRowID();
					update["repeating_npcaction-l_" + newrowid + "_npc_options-flag"] = "0";
					update["repeating_npcaction-l_" + newrowid + "_name"] = name;
					if(desc.substring(0,2) === ": " || encodeURI(desc.substring(0,2)) === ":%C2%A0") {
						desc = desc.substring(2);
					}
					if(desc.indexOf(" Attack:") > -1) {
						update["repeating_npcaction-l_" + newrowid + "_attack_flag"] = "on";
						update["repeating_npcaction-l_" + newrowid + "_attack_display_flag"] = "{{attack=1}}";
						update["repeating_npcaction-l_" + newrowid + "_attack_options"] = "{{attack=1}}";
						if(desc.indexOf(" Weapon Attack:") > -1) {
							attacktype = desc.split(" Weapon Attack:")[0];
						}
						else if(desc.indexOf(" Spell Attack:") > -1) {
							attacktype = desc.split(" Spell Attack:")[0];
						}
						else {
							console.log("FAILED TO IMPORT ATTACK - NO ATTACK TYPE FOUND (Weapon Attack/Spell Attack)");
							return;
						}
						update["repeating_npcaction-l_" + newrowid + "_attack_type"] = attacktype;
						if(attacktype === "Melee") {
							update["repeating_npcaction-l_" + newrowid + "_attack_range"] = (desc.match(/reach (.*?),/) || ["",""])[1];
						}
						else {
							update["repeating_npcaction-l_" + newrowid + "_attack_range"] = (desc.match(/range (.*?),/) || ["",""])[1];
						}
						update["repeating_npcaction-l_" + newrowid + "_attack_tohit"] = (desc.match(/\+(.*) to hit/) || ["",""])[1];
						update["repeating_npcaction-l_" + newrowid + "_attack_target"] = (desc.match(/\.,(?!.*\.,)(.*)\. Hit:/) || ["",""])[1];
						update["repeating_npcaction-l_" + newrowid + "_attack_damage"] = (desc.match(/\(([^)]+)\)/) || ["",""])[1];
						update["repeating_npcaction-l_" + newrowid + "_attack_damagetype"] = (desc.match(/\) (.*?) damage/) || ["",""])[1];
						if((desc.match(/\(/g) || []).length > 1 && (!desc.match(/\((?!.*\()([^)]+)\)/).indexOf(" DC")[1] || desc.match(/\((?!.*\()([^)]+)\)/).indexOf(" DC")[1] === -1)) {
							update["repeating_npcaction-l_" + newrowid + "_attack_damage2"] = (desc.match(/\((?!.*\()([^)]+)\)/) || ["",""])[1];
							update["repeating_npcaction-l_" + newrowid + "_attack_damagetype2"] = (desc.match(/\)(?!.*\)) (.*?) damage/) || ["",""])[1];
						}
					}
					else {
						update["repeating_npcaction-l_" + newrowid + "_description"] = desc;
					}
				});
			}

		}
	};
	if(category === "Feats") {
		update["tab"] = "features";
		var match = {name: page.name};
		var existing = _.findWhere(repeating.traits, match);
		var newrowid = generateRowID();
		if(existing) {
			newrowid = existing.id;
			existing.name = page.name;
			existing.source = "Feat";
			existing.type = page.data["Properties"] ? page.data["Properties"] : "";
		} else {
			var newtrait = {};
			newtrait.id = newrowid;
			newtrait.name = page.name;
			newtrait.source = "Feat";
			newtrait.type = page.data["Properties"] ? page.data["Properties"] : "";
			repeating.traits.push(newtrait);
		}
		if(page.name) {update["repeating_traits_" + newrowid + "_name"] = page.name};
		if(page.content) {update["repeating_traits_" + newrowid + "_description"] = page.content};
		update["repeating_traits_" + newrowid + "_source"] = "Feat";
		update["repeating_traits_" + newrowid + "_source_type"] = page.data["Properties"] ? page.data["Properties"] : "";
		update["repeating_traits_" + newrowid + "_options-flag"] = "0";
		update["repeating_traits_" + newrowid + "_display_flag"] = "on";
	};
	if(category === "Proficiencies") {
		var newrowid = generateRowID();
		var type = page.data["Type"] || "";
		if(type.toLowerCase() === "language" || type.toLowerCase() === "armor"
			|| type.toLowerCase() === "weapon" || type.toLowerCase() === "other") {
			if( repeating.prof_names.indexOf(page.name.toLowerCase()) == -1 ) {
				update["repeating_proficiencies_" + newrowid + "_prof_type"] = type.replace("custom", "").toUpperCase();
				update["repeating_proficiencies_" + newrowid + "_name"] = page.name;
				update["repeating_proficiencies_" + newrowid + "_options-flag"] = 0;
				repeating.prof_names.push(page.name.toLowerCase());
			};
		}
		else if(type.toLowerCase() === "tool" || type.toLowerCase() === "skillcustom") {
			let existing = {};
			_.each(repeating.tool, function(tool, id) {
				if(tool.toolname == page.name.toLowerCase()) {
					newrowid = id;
					existing = tool;
				}
			});
			if(!existing.toolname) repeating.tool[newrowid] = {toolname: page.name.toLowerCase()}
			update["repeating_tool_" + newrowid + "_toolname"] = page.name;
			if(!existing.base) update["repeating_tool_" + newrowid + "_toolattr_base"] = "?{Attribute?|Strength,@{strength_mod}|Dexterity,@{dexterity_mod}|Constitution,@{constitution_mod}|Intelligence,@{intelligence_mod}|Wisdom,@{wisdom_mod}|Charisma,@{charisma_mod}}";
			update["repeating_tool_" + newrowid + "_options-flag"] = 0;
			if(page.data["toolbonus_base"]) update["repeating_tool_" + newrowid + "_toolbonus_base"] = "(@{pb}*2)";
			repeating.prof_names.push(page.name.toLowerCase());
			callbacks.push( function() {update_tool(newrowid);} );
		}
		if(type.toLowerCase() === "skill") {
			var skill_string = page.name.toLowerCase().replace(/ /g, '_');
			update[skill_string + "_prof"] = "(@{pb}*@{" + skill_string + "_type})";
		};
	};
	if(category === "Classes") {
		update["tab"] = "core";
		if(page.data.multiclass) {
			if(page.name && page.name !== "") { update[page.data.multiclass] = page.name; }
			update[page.data.multiclass + "_flag"] = "1";
			classlevel = parseInt(currentData[page.data.multiclass + "_lvl"]);
		} else {
			if(page.name && page.name !== "") { update["class"] = page.name; }
			if(page.data["Hit Die"] && page.data["Hit Die"] !== "") {
				update["base_level"] = currentData.base_level ? currentData.base_level : "1";
				update["hit_dice_max"] = update["base_level"] + page.data["Hit Die"];
				update["hit_dice"] = update["base_level"];
			}
			if(page.data["Spellcasting Ability"] && page.data["Spellcasting Ability"] !== "") {
				update["spellcasting_ability"] = "@{" + page.data["Spellcasting Ability"].toLowerCase() + "_mod}+";
			}
		}
		if(page.data["data-Saving Throws"] && !page.data.multiclass) {
			var saves = jsonparse(page.data["data-Saving Throws"]);
			_.each(saves, function(value) {
				update[value.toLowerCase() + "_save_prof"] = "(@{pb})";
			});
		}

		if(!looped) {
			callbacks.push(update_class);
		}
	};
	if(category === "Subclasses") {
		if(page.data.multiclass) {
			if(page.name && page.name !== "") { update[page.data.multiclass + "_subclass"] = page.name; }
			classlevel = parseInt(currentData[page.data.multiclass + "_lvl"]);
		} else {
			if(page.name && page.name !== "") { update["subclass"] = page.name; };
		}
		if(page.data["Spellcasting Ability"]) {
			if(page.data.Class == "Fighter") {
				update["arcane_fighter"] = "1";
			} else if(page.data.Class == "Rogue") {
				update["arcane_rogue"] = "1";
			}
		}
		if(!looped) {
			callbacks.push(update_class);
		};
	};
	if(category === "Races" || category === "Subraces") {
		update["tab"] = "core";
		if(category === "Races") {
			update["race"] = page.name;
			if (page.name == "Halfling") {
				update["halflingluck_flag"] = "1";
			}
		}
		else {
			update["subrace"] = page.name;
		};
		if(page.data["Speed"]) {update["speed"] = page.data["Speed"]};
		if(page.data["Size"]) {update["size"] = page.data["Size"]};
		if(!looped) {
			callbacks.push(update_race_display);
		}
	};
	if(category === "Backgrounds") {
		update["tab"] = "features";
		if(page.name && page.name !== "") { update["background"] = page.name; };
	};

	if(page.data.theseblobs) {
		_.each(page.data.theseblobs, function(blobname) {
			if(page.data.blobs[blobname]) blobs[blobname] = page.data.blobs[blobname];
		});
	} else {
		blobs = filterBlobs(page.data.blobs, {"Level": "1"});
	}
	_.each(blobs, function(blob, blobname) {
		if(blob["Traits"]) {
			var traitsource = "";
			switch (category) {
				case "Races":
				case "Subraces":
					traitsource = "Racial";
					break;
				case "Classes":
				case "Subclasses":
					traitsource = "Class";
					break;
				default:
					traitsource = "Background";
			}
			var trait_array = jsonparse(blob["Traits"]);
			if(trait_array && trait_array.length) {
				_.each(trait_array, function(trait) {
					if(!trait.Input) {
						var match = {name: trait["Name"], type: page.name};
						if(trait["Replace"]) {
							match = {name: trait["Replace"]};
						}
						var existing = _.findWhere(repeating.traits, match);
						if(existing) {
							newrowid = existing.id;
							existing.name = trait["Name"];
							existing.source = traitsource;
							existing.type = page.name;
						} else {
							var newtrait = {};
							newrowid = generateRowID();
							newtrait.id = newrowid;
							newtrait.name = trait["Name"];
							newtrait.source = traitsource;
							newtrait.type = page.name;
							repeating.traits.push(newtrait);
						}
						update["repeating_traits_" + newrowid + "_name"] = trait["Name"].replace(/{{Input}}/g, "");
						update["repeating_traits_" + newrowid + "_description"] = trait["Desc"] ? trait["Desc"].replace(/{{Input}}/g, "") : "";
						update["repeating_traits_" + newrowid + "_source"] = traitsource;
						update["repeating_traits_" + newrowid + "_source_type"] = page.name ? page.name : "";
						update["repeating_traits_" + newrowid + "_options-flag"] = 0;
						update["repeating_traits_" + newrowid + "_display_flag"] = "on";
					}
				});
			};
		};
		if(blob["Language Proficiency"] || blob["Weapon Proficiency"] || blob["Armor Proficiency"] || blob["Tool Proficiency"]) {
			if(blob["Language Proficiency"]) {
				var lang_array = jsonparse(blob["Language Proficiency"]);
				if(lang_array["Proficiencies"] && lang_array["Proficiencies"].length) {
					_.each(lang_array["Proficiencies"], function(prof) {
						if( repeating.prof_names.indexOf(prof.toLowerCase()) == -1 ) {
							newrowid = generateRowID();
							update["repeating_proficiencies_" + newrowid + "_prof_type"] = "LANGUAGE";
							update["repeating_proficiencies_" + newrowid + "_name"] = prof;
							update["repeating_proficiencies_" + newrowid + "_options-flag"] = 0;
							repeating.prof_names.push(prof.toLowerCase());
						}
					});
				}
			};
			if(blob["Weapon Proficiency"]) {
				var weap_array = jsonparse(blob["Weapon Proficiency"]);
				if(weap_array["Proficiencies"] && weap_array["Proficiencies"].length) {
					_.each(weap_array["Proficiencies"], function(prof) {
						if( repeating.prof_names.indexOf(prof.toLowerCase()) == -1 ) {
							newrowid = generateRowID();
							update["repeating_proficiencies_" + newrowid + "_prof_type"] = "WEAPON";
							update["repeating_proficiencies_" + newrowid + "_name"] = prof;
							update["repeating_proficiencies_" + newrowid + "_options-flag"] = 0;
							repeating.prof_names.push(prof.toLowerCase());
						}
					});
				}
			};
			if(blob["Armor Proficiency"]) {
				var armor_array = jsonparse(blob["Armor Proficiency"]);
				if(armor_array["Proficiencies"] && armor_array["Proficiencies"].length) {
					_.each(armor_array["Proficiencies"], function(prof) {
						if( repeating.prof_names.indexOf(prof.toLowerCase()) == -1 ) {
							newrowid = generateRowID();
							update["repeating_proficiencies_" + newrowid + "_prof_type"] = "ARMOR";
							update["repeating_proficiencies_" + newrowid + "_name"] = prof;
							update["repeating_proficiencies_" + newrowid + "_options-flag"] = 0;
							repeating.prof_names.push(prof.toLowerCase());
						}
					});
				}
			};
			if(blob["Tool Proficiency"]) {
				var tool_array = jsonparse(blob["Tool Proficiency"]);
				if(tool_array["Proficiencies"] && tool_array["Proficiencies"].length) {
					_.each(tool_array["Proficiencies"], function(prof) {
						let existing = {};
						_.each(repeating.tool, function(tool, id) {
							if(tool.toolname == prof.toLowerCase()) {
								newrowid = id;
								existing = tool;
							}
						});
						if(!existing.toolname) repeating.tool[newrowid] = {toolname: prof.toLowerCase()}
						update["repeating_tool_" + newrowid + "_toolname"] = prof;
						if(!existing.base) update["repeating_tool_" + newrowid + "_toolattr_base"] = "?{Attribute?|Strength,@{strength_mod}|Dexterity,@{dexterity_mod}|Constitution,@{constitution_mod}|Intelligence,@{intelligence_mod}|Wisdom,@{wisdom_mod}|Charisma,@{charisma_mod}}";
						update["repeating_tool_" + newrowid + "_options-flag"] = 0;
						repeating.prof_names.push(page.name.toLowerCase());
						callbacks.push( function() {update_tool(newrowid);} );
					});
				}
			};
		};
		if(blob["Skill Proficiency"]) {
			var skill_array = jsonparse(blob["Skill Proficiency"]);
			if(skill_array["Proficiencies"] && skill_array["Proficiencies"].length) {
				 _.each(skill_array["Proficiencies"], function(prof) {
					var skill_string = prof.toLowerCase().replace(/ /g, '_');
					update[skill_string + "_prof"] = "(@{pb}*@{" + skill_string + "_type})";
				});
			};
		};
		if(blob["Actions"]) {
			var actionsobj = {};
			jsonparse(blob["Actions"]).forEach(function(val) { actionsobj[val.Name] = val; });
			_.each(actionsobj, function(action, name) {
				newrowid = generateRowID();
				_.each(repeating.attack, function(atk, atkid) {
					if(atk.atkname === name) newrowid = atkid;
				});
				update["repeating_attack_" + newrowid + "_options-flag"] = "0";
				update["repeating_attack_" + newrowid + "_atkname"] = name;
				if(action["Desc"]) {
					update["repeating_attack_" + newrowid + "_atk_desc"] = action["Desc"];
				}

				if(action["Type Attack"]) {
					if (action["Type"] == "Spell") {
						update["repeating_attack_" + newrowid + "_atkflag"] = "0";
						update["repeating_attack_" + newrowid + "_attack_options"] = "";
						update["repeating_attack_" + newrowid + "_saveflag"] = "{{save=1}} {{saveattr=@{saveattr}}} {{savedesc=@{saveeffect}}} {{savedc=[[[[@{savedc}]][SAVE]]]}}"
					} else {
						update["repeating_attack_" + newrowid + "_attack_flag"] = "on";
						update["repeating_attack_" + newrowid + "_atkflag"] = "{{attack=1}}";
						update["repeating_attack_" + newrowid + "_attack_options"] = "{{attack=1}}";
					}
					if(action["Reach"]) { update["repeating_attack_" + newrowid + "_atkrange"] = action["Reach"]; }

					if(action["Damage"]) { update["repeating_attack_" + newrowid + "_dmgbase"] = action["Damage"]; }
					if(action["Damage Type"]) { update["repeating_attack_" + newrowid + "_dmgtype"] = action["Damage Type"]; }
					if (action["Modifier"]) {
						update["repeating_attack_" + newrowid + "_dmgattr"] = modStringToAttrib(action["Modifier"]);
						update["repeating_attack_" + newrowid + "_atkattr_base"] = modStringToAttrib(action["Modifier"]);
					} else {
						update["repeating_attack_" + newrowid + "_dmgattr"] = "0";
					}
					if (action["Save"]) { update["repeating_attack_" + newrowid + "_saveattr"] = action["Save"] }
					if (action["Save DC"]) { update["repeating_attack_" + newrowid + "_savedc"] = "(" + modStringToAttrib(action["Save DC"]) + "+8+@{pb})" }
					if (action["Save Effect"]) { update["repeating_attack_" + newrowid + "_saveeffect"] = action["Save Effect"] }

					if(action["Damage 2"] && action["Damage 2 Type"]) {
						update["repeating_attack_" + newrowid + "_dmg2flag"] = "{{damage=1}} {{dmg2flag=1}}";
						update["repeating_attack_" + newrowid + "_atk_dmg2base"] = action["Damage 2"];
						update["repeating_attack_" + newrowid + "_attack_damagetype2"] = action["Damage 2 Type"];
						if (action["Modifier 2"]) {
							update["repeating_attack_" + newrowid + "_dmg2attr"] = modStringToAttrib(action["Modifier 2"]);
						} else {
							update["repeating_attack_" + newrowid + "_dmgattr"] = "0";
						}
					}
				}
			});
		};
		if(blob["Global Damage"]) {
			var dmgmod = jsonparse(blob["Global Damage"]);
			var id = generateRowID();
			_.each(repeating.damagemod, function(name, rowid) {
				if(name.toLowerCase() === dmgmod["Name"].toLowerCase()) id = rowid;
			});
			update["repeating_damagemod_" + id + "_global_damage_name"] = `${dmgmod["Name"]}`;
			update["repeating_damagemod_" + id + "_global_damage_damage"] = `${parseValues(dmgmod["Damage"])}`;
			if(dmgmod["Active"] == "true") update["repeating_damagemod_" + id + "_global_damage_active_flag"] = "1";
			update["repeating_damagemod_" + id + "_options-flag"] = "0";
			update["repeating_damagemod_" + id + "_global_damage_type"] = dmgmod["Type"] ? dmgmod["Type"] : dmgmod["Name"];
			update["global_damage_mod_flag"] = "1";
			repeating.damagemod[id] = dmgmod["Name"];
		};
		if(blob["Resources"]) {
			var resources = jsonparse(blob["Resources"]);
			_.each(resources, function(value) {
				var section = "";
				if(currentData["class_resource_name"] == "" || currentData["class_resource_name"] == value["Name"]) {
					section = "class_resource";
				} else if (currentData["other_resource_name"] == "" || currentData["other_resource_name"] == value["Name"]) {
					section = "other_resource";
				} else {
					_.each(repeating.resource, function(resource, id) {
						if(resource.left == "" && section == "" || resource.left == value["Name"]) {
							section = "repeating_resource_" + id + "_resource_left";
						}
						if(resource.right == "" && section == "" || resource.right == value["Name"]) {
							section = "repeating_resource_" + id + "_resource_right";
						}
					})
				}
				if(section === "") {
					var id = generateRowID();
					section = "repeating_resource_" + id + "_resource_left";
					repeating.resource[id] = {left: value["Name"], right: ""};
				}
				update[section + "_name"] = value["Name"];
				if(value["Uses"]) update[section] = numUses(value["Uses"]);
				update[section + "_max"] = value["Max"] ? numUses(value["Max"]) : numUses(value["Uses"]);
			});
		};
		if(blob["Custom AC"]) {
			var customac = jsonparse(blob["Custom AC"]);
			update["custom_ac_flag"] = "1";
			update["custom_ac_base"] = customac.Base;
			update["custom_ac_part1"] = customac["Attribute 1"];
			update["custom_ac_part2"] = customac["Attribute 2"] ? customac["Attribute 2"] : "";
			update["custom_ac_shield"] = customac.Shields;
			if(!looped) {
				callbacks.push( function() {update_ac();} )
			}
		};
		if(blob["Hit Points Per Level"]) {
			var id = generateRowID();
			update["repeating_hpmod_" + id + "_mod"] = blob["Hit Points Per Level"];
			update["repeating_hpmod_" + id + "_source"] = page.name ? page.name : "Subclass";
			if(category === "Races" || category === "Subraces") {
				update["repeating_hpmod_" + id + "_levels"] = "total";
			} else {
				update["repeating_hpmod_" + id + "_levels"] = "base";
			}
		};
		if(blob["Global AC Mod"]) {
			var globalac = jsonparse(blob["Global AC Mod"]);
			var id = generateRowID();
			_.each(repeating.acmod, function(name, rowid) {
				if(name.toLowerCase() === globalac["Name"].toLowerCase()) id = rowid;
			});
			update["repeating_acmod_" + id + "_global_ac_val"] = globalac.Bonus;
			if(globalac["Active"] !== "false") update["repeating_acmod_" + id + "_global_ac_active_flag"] = "1";
			update["repeating_acmod_" + id + "_options-flag"] = "0";
			update["repeating_acmod_" + id + "_global_ac_name"] = globalac.Name;
			update["global_ac_mod_flag"] = "1";
		};
		if(blob["Global Save"]) {
			var globalsave = jsonparse(blob["Global Save Mod"]);
			var id = generateRowID();
			_.each(repeating.savemod, function(name, rowid) {
				if(name.toLowerCase() === globalsave["Name"].toLowerCase()) id = rowid;
			});
			update["repeating_savemod_" + id + "_global_save_roll"] = globalsave.Bonus;
			if(globalsave["Active"] !== "false") update["repeating_savemod_" + id + "_global_save_active_flag"] = "1";
			update["repeating_savemod_" + id + "_options-flag"] = "0";
			update["repeating_savemod_" + id + "_global_save_name"] = globalsave.Name;
			update["global_save_mod_flag"] = "1";
		}
		if(blob["Global Attack"]) {
			var globalattack = jsonparse(blob["Global Attack"]);
			var id = generateRowID();
			_.each(repeating.tohitmod, function(name, rowid) {
				if(name.toLowerCase() === globalattack["Name"].toLowerCase()) id = rowid;
			});
			update["repeating_tohitmod_" + id + "_global_attack_rollstring"] = `${globalattack["Bonus"]}[${globalattack["Name"]}]`;
			if(globalattack["Active"] !== "false") update["repeating_tohitmod_" + id + "_global_attack_active_flag"] = "1";
			update["repeating_tohitmod_" + id + "_options-flag"] = "0";
			update["global_attack_mod_flag"] = "1";
		};
		if(blob["Initiative"]) {
			if(blob["Initiative"].toLowerCase() === "advantage") {
				update["initiative_style"] = "{@{d20},@{d20}}kh1";
			} else if (blob["Initiative"].toLowerCase() === "disadvantage") {
				update["initiative_style"] = "{@{d20},@{d20}}kl1";
			} else {
				update.initmod = numUses(blob["Initiative"]);
			}
		};
		if(blob["Carry Multiplier"]) {
			update["carrying_capacity_mod"] = "*" + blob["Carry Multiplier"];
		};
		if(blob["Speed"]) {
			if(blob["Speed"][0] === "+") {
				let prevspeed = update["speed"] || currentData["speed"];
				prevspeed = prevspeed && !isNaN(parseInt(prevspeed)) ? parseInt(prevspeed) : 0;
				update["speed"] = prevspeed + parseInt(blob["Speed"]);
			} else {
				update["speed"] = parseInt(blob["Speed"]);
			}
		};
		if(blob["Jack of All Trades"]) {
			update["jack_of_all_trades"] = "@{jack}";
		};
		if(blob["Saving Throws"]) {
			var saves = jsonparse(blob["Saving Throws"]);
			_.each(saves, function(value) {
				update[value.toLowerCase() + "_save_prof"] = "(@{pb})";
			});
		};
		if(blob["Custom Spells"]) {
			let spells = jsonparse(blob["Custom Spells"]);
			_.each(spells, function(spell) {
				var lvl = spell["Level"] && spell["Level"] > 0 ? spell["Level"] : "cantrip";
				let id = generateRowID();
				if(repeating["spell-" + lvl]) {
					_.each(repeating["spell-" + lvl], function(spell, spellid) {
						if(spell.spellname.toLowerCase() === page.name.toLowerCase()) {
							id = spellid;
						}
					});
				}
				update["repeating_spell-" + lvl + "_" + id + "_spelllevel"] = lvl;
				if(spell["spellcasting_ability"]) {
					update["repeating_spell-" + lvl + "_" + id + "_spell_ability"] = "@{" + spell["spellcasting_ability"].toLowerCase() + "_mod}+";;
				} else {
					update["repeating_spell-" + lvl + "_" + id + "_spell_ability"] = "spell";
				}
				if(spell["spellclass"]) {
					update["repeating_spell-" + lvl + "_" + id + "_spellclass"] = spell["spellclass"];
				}
				if(spell["spellsource"]) {
					update["repeating_spell-" + lvl + "_" + id + "_spellsource"] = spell["spellsource"];
				}
				update["repeating_spell-" + lvl + "_" + id + "_spellname"] = spell.Name;
				if(spell["Ritual"]) {update["repeating_spell-" + lvl + "_" + id + "_spellritual"] = "{{ritual=1}}"};
				if(spell["School"]) {update["repeating_spell-" + lvl + "_" + id + "_spellschool"] = spell["School"].toLowerCase()};
				if(spell["Casting Time"]) {update["repeating_spell-" + lvl + "_" + id + "_spellcastingtime"] = spell["Casting Time"]};
				if(spell["Range"]) {update["repeating_spell-" + lvl + "_" + id + "_spellrange"] = spell["Range"]};
				if(spell["Target"]) {update["repeating_spell-" + lvl + "_" + id + "_spelltarget"] = spell["Target"]};
				if(spell["Components"]) {
					if(spell["Components"].toLowerCase().indexOf("v") === -1) {update["repeating_spell-" + lvl + "_" + id + "_spellcomp_v"] = "0"};
					if(spell["Components"].toLowerCase().indexOf("s") === -1) {update["repeating_spell-" + lvl + "_" + id + "_spellcomp_s"] = "0"};
					if(spell["Components"].toLowerCase().indexOf("m") === -1) {update["repeating_spell-" + lvl + "_" + id + "_spellcomp_m"] = "0"};
				};
				if(spell["Material"]) {update["repeating_spell-" + lvl + "_" + id + "_spellcomp_materials"] = spell["Material"]};
				if(spell["Concentration"]) {update["repeating_spell-" + lvl + "_" + id + "_spellconcentration"] = "{{concentration=1}}"};
				if(spell["Duration"]) {update["repeating_spell-" + lvl + "_" + id + "_spellduration"] = spell["Duration"]};
				if(spell["Damage"] || spell["Healing"]) {
					update["repeating_spell-" + lvl + "_" + id + "_spelloutput"] = "ATTACK";
					callbacks.push( function() {create_attack_from_spell(lvl, id, currentData.character_id);} );
				}
				else if(spell["Higher Spell Slot Desc"] && spell["Higher Spell Slot Desc"] != "") {
					var spelllevel = "?{Cast at what level?";
					for(i = 0; i < 10-lvl; i++) {
						spelllevel = spelllevel + "|Level " + (parseInt(i, 10) + parseInt(lvl, 10)) + "," + (parseInt(i, 10) + parseInt(lvl, 10));
					}
					spelllevel = spelllevel + "}";
					update["repeating_spell-" + lvl + "_" + id + "_rollcontent"] = "@{wtype}&{template:spell} {{level=@{spellschool} " + spelllevel + "}} {{name=@{spellname}}} {{castingtime=@{spellcastingtime}}} {{range=@{spellrange}}} {{target=@{spelltarget}}} @{spellcomp_v} @{spellcomp_s} @{spellcomp_m} {{material=@{spellcomp_materials}}} {{duration=@{spellduration}}} {{description=@{spelldescription}}} {{athigherlevels=@{spellathigherlevels}}} @{spellritual} {{innate=@{innate}}} @{spellconcentration} @{charname_output}";
				};
				if(spell["Spell Attack"]) {update["repeating_spell-" + lvl + "_" + id + "_spellattack"] = spell["Spell Attack"]};
				if(spell["Damage"]) {update["repeating_spell-" + lvl + "_" + id + "_spelldamage"] = spell["Damage"]};
				if(spell["Damage Type"]) {update["repeating_spell-" + lvl + "_" + id + "_spelldamagetype"] = spell["Damage Type"]};
				if(spell["Secondary Damage"]) {update["repeating_spell-" + lvl + "_" + id + "_spelldamage2"] = spell["Secondary Damage"]};
				if(spell["Secondary Damage Type"]) {update["repeating_spell-" + lvl + "_" + id + "_spelldamagetype2"] = spell["Secondary Damage Type"]};
				if(spell["Healing"]) {update["repeating_spell-" + lvl + "_" + id + "_spellhealing"] = spell["Healing"];};
				if(spell["Add Casting Modifier"]) {update["repeating_spell-" + lvl + "_" + id + "_spelldmgmod"] = spell["Add Casting Modifier"]};
				if(spell["Save"]) {update["repeating_spell-" + lvl + "_" + id + "_spellsave"] = spell["Save"]};
				if(spell["Save Success"]) {update["repeating_spell-" + lvl + "_" + id + "_spellsavesuccess"] = spell["Save Success"]};
				if(spell["Higher Spell Slot Dice"]) {update["repeating_spell-" + lvl + "_" + id + "_spellhldie"] = spell["Higher Spell Slot Dice"]};
				if(spell["Higher Spell Slot Die"]) {update["repeating_spell-" + lvl + "_" + id + "_spellhldietype"] = spell["Higher Spell Slot Die"]};
				if(spell["Higher Spell Slot Bonus"]) {update["repeating_spell-" + lvl + "_" + id + "_spellhlbonus"] = spell["Higher Spell Slot Bonus"]};
				if(spell["Higher Spell Slot Desc"]) {update["repeating_spell-" + lvl + "_" + id + "_spellathigherlevels"] = spell["Higher Spell Slot Desc"]};
				if(spell["data-Cantrip Scaling"] && lvl == "cantrip") {update["repeating_spell-" + lvl + "_" + id + "_spell_damage_progression"] = "Cantrip " + spell["data-Cantrip Scaling"].charAt(0).toUpperCase() + spell["data-Cantrip Scaling"].slice(1);};
				if(spell["data-description"]) { update["repeating_spell-" + lvl + "_" + id + "_spelldescription"] = spell["data-description"]};
				update["repeating_spell-" + lvl + "_" + id + "_options-flag"] = "0";
			})
		};
		if(blob["Global Save Mod"]) {
			update["globalsavemod"] = numUses(blob["Global Save Mod"]);
		};
		if(blob["Proficiency Bonus"]) {
			var bonus = jsonparse(blob["Proficiency Bonus"]);
			_.each(bonus, function(value, prof) {
				update[prof.replace(/ /g, "_").toLowerCase() + "_flat"] = numUses(value);
			});
		};
		/**/
	});

	return {
		update: update,
		repeating: repeating,
		callbacks: callbacks
	};
};

var check_itemmodifiers = function(modifiers, previousValue) {
	var mods = modifiers.toLowerCase().split(",");
	if(previousValue) {
		prevmods = previousValue.toLowerCase().split(",");
		mods = _.union(mods, prevmods);
	};
	_.each(mods, function(mod) {
		if(mod.indexOf("ac:") > -1 || mod.indexOf("ac +") > -1 || mod.indexOf("ac -") > -1) {update_ac();};
		if(mod.indexOf("spell") > -1) {update_spell_info();};
		if(mod.indexOf("saving throws") > -1) {update_all_saves();};
		if(mod.indexOf("strength save") > -1) {update_save("strength");} else if(mod.indexOf("strength") > -1) {update_attr("strength");};
		if(mod.indexOf("dexterity save") > -1) {update_save("dexterity");} else if(mod.indexOf("dexterity") > -1) {update_attr("dexterity");};
		if(mod.indexOf("constitution save") > -1) {update_save("constitution");} else if(mod.indexOf("constitution") > -1) {update_attr("constitution");};
		if(mod.indexOf("intelligence save") > -1) {update_save("intelligence");} else if(mod.indexOf("intelligence") > -1) {update_attr("intelligence");};
		if(mod.indexOf("wisdom save") > -1) {update_save("wisdom");} else if(mod.indexOf("wisdom") > -1) {update_attr("wisdom");};
		if(mod.indexOf("charisma save") > -1) {update_save("charisma");} else if(mod.indexOf("charisma") > -1) {update_attr("charisma");};
		if(mod.indexOf("ability checks") > -1) {update_all_ability_checks();};
		if(mod.indexOf("acrobatics") > -1) {update_skills(["acrobatics"]);};
		if(mod.indexOf("animal handling") > -1) {update_skills(["animal_handling"]);};
		if(mod.indexOf("arcana") > -1) {update_skills(["arcana"]);};
		if(mod.indexOf("athletics") > -1) {update_skills(["athletics"]);};
		if(mod.indexOf("deception") > -1) {update_skills(["deception"]);};
		if(mod.indexOf("history") > -1) {update_skills(["history"]);};
		if(mod.indexOf("insight") > -1) {update_skills(["insight"]);};
		if(mod.indexOf("intimidation") > -1) {update_skills(["intimidation"]);};
		if(mod.indexOf("investigation") > -1) {update_skills(["investigation"]);};
		if(mod.indexOf("medicine") > -1) {update_skills(["medicine"]);};
		if(mod.indexOf("nature") > -1) {update_skills(["nature"]);};
		if(mod.indexOf("perception") > -1) {update_skills(["perception"]);};
		if(mod.indexOf("performance") > -1) {update_skills(["performance"]);};
		if(mod.indexOf("persuasion") > -1) {update_skills(["persuasion"]);};
		if(mod.indexOf("religion") > -1) {update_skills(["religion"]);};
		if(mod.indexOf("sleight of hand") > -1) {update_skills(["sleight_of_hand"]);};
		if(mod.indexOf("stealth") > -1) {update_skills(["stealth"]);};
		if(mod.indexOf("survival") > -1) {update_skills(["survival"]);};
	});
};

var create_attack_from_item = function(itemid, options) {
	var update = {};
	var newrowid = generateRowID();
	update["repeating_inventory_" + itemid + "_itemattackid"] = newrowid;
	if(options && options.versatile) {
		var newrowid2 = generateRowID();
		update["repeating_inventory_" + itemid + "_itemattackid"] += "," + newrowid2;
		setAttrs(update, {}, function() {
			update_attack_from_item(itemid, newrowid, {newattack: true, versatile: "primary"});
			update_attack_from_item(itemid, newrowid2, {newattack: true, versatile: "secondary"});
		});
	}
	else {
		setAttrs(update, {}, update_attack_from_item(itemid, newrowid, {newattack: true}));
	}
};

var update_attack_from_item = function(itemid, attackid, options) {
	getAttrs(["repeating_inventory_" + itemid + "_itemname","repeating_inventory_" + itemid + "_itemproperties","repeating_inventory_" + itemid + "_itemmodifiers", "strength", "dexterity"], function(v) {
		var update = {}; var itemtype; var damage; var damagetype; var damage2; var damagetype2; var attackmod; var damagemod; var range;
		var alt = {};

		if(options && options.newattack) {
			update["repeating_attack_" + attackid + "_options-flag"] = "0";
			update["repeating_attack_" + attackid + "_itemid"] = itemid;
		}

		if(v["repeating_inventory_" + itemid + "_itemmodifiers"] && v["repeating_inventory_" + itemid + "_itemmodifiers"] != "") {
			var mods = v["repeating_inventory_" + itemid + "_itemmodifiers"].split(",");
			_.each(mods, function(mod) {
				if(mod.indexOf("Item Type:") > -1) {itemtype = mod.split(":")[1].trim()}
				else if(mod.indexOf("Alternate Secondary Damage Type:") > -1) {alt.damagetype2 = mod.split(":")[1].trim();}
				else if(mod.indexOf("Alternate Secondary Damage:") > -1) {alt.damage2 = mod.split(":")[1].trim();}
				else if(mod.indexOf("Alternate Damage Type:") > -1) {alt.damagetype = mod.split(":")[1].trim();}
				else if(mod.indexOf("Alternate Damage:") > -1) {alt.damage = mod.split(":")[1].trim();}
				else if(mod.indexOf("Secondary Damage Type:") > -1) {damagetype2 = mod.split(":")[1].trim()}
				else if(mod.indexOf("Secondary Damage:") > -1) {damage2 = mod.split(":")[1].trim()}
				else if(mod.indexOf("Damage Type:") > -1) {damagetype = mod.split(":")[1].trim()}
				else if(mod.indexOf("Damage:") > -1) {damage = mod.split(":")[1].trim()}
				else if(mod.indexOf("Range:") > -1) {range = mod.split(":")[1].trim()}
				else if(mod.indexOf(" Attacks ") > -1) {attackmod = mod.split(" Attacks ")[1].trim()}
				else if(mod.indexOf(" Damage ") > -1) {damagemod = mod.split(" Damage ")[1].trim()}
			});
		}

		if(v["repeating_inventory_" + itemid + "_itemname"] && v["repeating_inventory_" + itemid + "_itemname"] != "") {
			update["repeating_attack_" + attackid + "_atkname"] = v["repeating_inventory_" + itemid + "_itemname"];
			if(options && options.versatile === "primary") {
				update["repeating_attack_" + attackid + "_atkname"] += " (One-Handed)";
			} else if(options && options.versatile === "secondary") {
				update["repeating_attack_" + attackid + "_atkname"] += " (Two-Handed)";
			}
		}
		if(options && options.versatile === "secondary") {
			if(alt.damage) {
				update["repeating_attack_" + attackid + "_dmgbase"] = alt.damage;
			}
			if(alt.damagetype) {
				update["repeating_attack_" + attackid + "_dmgtype"] = alt.damagetype;
			}
			if(alt.damage2) {
				update["repeating_attack_" + attackid + "_dmg2base"] = alt.damage2;
				update["repeating_attack_" + attackid + "_dmg2attr"] = 0;
				update["repeating_attack_" + attackid + "_dmg2flag"] = "{{damage=1}} {{dmg2flag=1}}";
			}
			if(alt.damagetype2) {
				update["repeating_attack_" + attackid + "_dmg2type"] = alt.damagetype2;
			}
			update["repeating_attack_" + attackid + "_versatile_alt"] = "1";
		}
		else {
			if(damage) {
				update["repeating_attack_" + attackid + "_dmgbase"] = damage;
			}
			if(damagetype) {
				update["repeating_attack_" + attackid + "_dmgtype"] = damagetype;
			}
			if(damage2) {
				update["repeating_attack_" + attackid + "_dmg2base"] = damage2;
				update["repeating_attack_" + attackid + "_dmg2attr"] = 0;
				update["repeating_attack_" + attackid + "_dmg2flag"] = "{{damage=1}} {{dmg2flag=1}}";
			}
			if(damagetype2) {
				update["repeating_attack_" + attackid + "_dmg2type"] = damagetype2;
			}
		}
		if(range) {
			update["repeating_attack_" + attackid + "_atkrange"] = range;
		}
		var finesse = v["repeating_inventory_" + itemid + "_itemproperties"] && /finesse/i.test(v["repeating_inventory_" + itemid + "_itemproperties"]);
		if( (itemtype && itemtype.indexOf("Ranged") > -1) || (finesse && +v.dexterity > +v.strength)) {
			update["repeating_attack_" + attackid + "_atkattr_base"] = "@{dexterity_mod}";
			update["repeating_attack_" + attackid + "_dmgattr"] = "@{dexterity_mod}";
		}
		else {
			update["repeating_attack_" + attackid + "_atkattr_base"] = "@{strength_mod}";
			update["repeating_attack_" + attackid + "_dmgattr"] = "@{strength_mod}";
		}
		if(attackmod && damagemod && attackmod == damagemod) {
			update["repeating_attack_" + attackid + "_atkmagic"] = parseInt(attackmod, 10);
			update["repeating_attack_" + attackid + "_atkmod"] = "";
			update["repeating_attack_" + attackid + "_dmgmod"] = "";
		}
		else {
			if(attackmod) {
				update["repeating_attack_" + attackid + "_atkmod"] = parseInt(attackmod, 10);
			}
			if(damagemod) {
				update["repeating_attack_" + attackid + "_dmgmod"] = parseInt(damagemod, 10);
			}
			update["repeating_attack_" + attackid + "_atkmagic"] = "";
		}
		var callback = function() {update_attacks(attackid, "item")};
		setAttrs(update, {silent: true}, callback);
	});
};

var create_resource_from_item = function(itemid) {
	var update = {};
	var newrowid = generateRowID();

	getAttrs(["other_resource_name"], function(x) {
		if(!x.other_resource_name || x.other_resource_name == "") {
			update["repeating_inventory_" + itemid + "_itemresourceid"] = "other_resource";
			setAttrs(update, {}, update_resource_from_item(itemid, "other_resource", true));
		}
		else {
			getSectionIDs("repeating_resource", function(idarray) {
				if(idarray.length == 0) {
					update["repeating_inventory_" + itemid + "_itemresourceid"] = newrowid + "_resource_left";
					setAttrs(update, {}, update_resource_from_item(itemid, newrowid + "_resource_left", true));
				}
				else {
					var resource_names = [];
					_.each(idarray, function(currentID, i) {
						resource_names.push("repeating_resource_" + currentID + "_resource_left_name");
						resource_names.push("repeating_resource_" + currentID + "_resource_right_name");
					});

					getAttrs(resource_names, function(y) {
						var existing = false;
						_.each(idarray, function(currentID, i) {
							if((!y["repeating_resource_" + currentID + "_resource_left_name"] || y["repeating_resource_" + currentID + "_resource_left_name"] === "") && existing == false) {
								update["repeating_inventory_" + itemid + "_itemresourceid"] = currentID + "_resource_left";
								setAttrs(update, {}, update_resource_from_item(itemid, currentID + "_resource_left", true));
								existing = true;
							}
							else if((!y["repeating_resource_" + currentID + "_resource_right_name"] || y["repeating_resource_" + currentID + "_resource_right_name"] === "") && existing == false) {
								update["repeating_inventory_" + itemid + "_itemresourceid"] = currentID + "_resource_right";
								setAttrs(update, {}, update_resource_from_item(itemid, currentID + "_resource_right", true));
								existing = true;
							};
						});
						if(!existing) {
							update["repeating_inventory_" + itemid + "_itemresourceid"] = newrowid + "_resource_left";
							setAttrs(update, {}, update_resource_from_item(itemid, newrowid + "_resource_left", true));
						}
					});

				};
			});
		};
	});

};

var update_resource_from_item = function(itemid, resourceid, newresource) {
	getAttrs(["repeating_inventory_" + itemid + "_itemname","repeating_inventory_" + itemid + "_itemcount"], function(v) {
		var update = {}; var id;

		if(resourceid && resourceid == "other_resource") {
			id = resourceid;
		}
		else {
			id = "repeating_resource_" + resourceid;
		};

		if(newresource) {
			update[id + "_itemid"] = itemid;
		} ;

		if(!v["repeating_inventory_" + itemid + "_itemname"]) {
			update["repeating_inventory_" + itemid + "_useasresource"] = 0;
			update["repeating_inventory_" + itemid + "_itemresourceid"] = "";
			remove_resource(resourceid);
		};
		if(v["repeating_inventory_" + itemid + "_itemname"] && v["repeating_inventory_" + itemid + "_itemname"] != "") {
			update[id + "_name"] = v["repeating_inventory_" + itemid + "_itemname"];
		};
		if(v["repeating_inventory_" + itemid + "_itemcount"] && v["repeating_inventory_" + itemid + "_itemcount"] != "") {
			update[id] = v["repeating_inventory_" + itemid + "_itemcount"];
		};

		setAttrs(update, {silent: true});

	});
};

var update_item_from_resource = function(resourceid, itemid) {
	var update = {};
	getAttrs([resourceid, resourceid + "_name"], function(v) {
		update["repeating_inventory_" + itemid + "_itemcount"] = v[resourceid];
		update["repeating_inventory_" + itemid + "_itemname"] = v[resourceid + "_name"];
		setAttrs(update, {silent: true}, function() {update_weight()});
	});
};

var create_attack_from_spell = function(lvl, spellid, character_id) {
	var update = {};
	var newrowid = generateRowID();
	update["repeating_spell-" + lvl + "_" + spellid + "_spellattackid"] = newrowid;
	update["repeating_spell-" + lvl + "_" + spellid + "_rollcontent"] = "%{" + character_id + "|repeating_attack_" + newrowid + "_attack}";
	setAttrs(update, {}, update_attack_from_spell(lvl, spellid, newrowid, true));
}

var update_attack_from_spell = function(lvl, spellid, attackid, newattack) {
	getAttrs(["repeating_spell-" + lvl + "_" + spellid + "_spellname",
		"repeating_spell-" + lvl + "_" + spellid + "_spellrange",
		"repeating_spell-" + lvl + "_" + spellid + "_spelltarget",
		"repeating_spell-" + lvl + "_" + spellid + "_spellattack",
		"repeating_spell-" + lvl + "_" + spellid + "_spelldamage",
		"repeating_spell-" + lvl + "_" + spellid + "_spelldamage2",
		"repeating_spell-" + lvl + "_" + spellid + "_spelldamagetype",
		"repeating_spell-" + lvl + "_" + spellid + "_spelldamagetype2",
		"repeating_spell-" + lvl + "_" + spellid + "_spellhealing",
		"repeating_spell-" + lvl + "_" + spellid + "_spelldmgmod",
		"repeating_spell-" + lvl + "_" + spellid + "_spellsave",
		"repeating_spell-" + lvl + "_" + spellid + "_spellsavesuccess",
		"repeating_spell-" + lvl + "_" + spellid + "_spellhldie",
		"repeating_spell-" + lvl + "_" + spellid + "_spellhldietype",
		"repeating_spell-" + lvl + "_" + spellid + "_spellhlbonus",
		"repeating_spell-" + lvl + "_" + spellid + "_spelllevel",
		"repeating_spell-" + lvl + "_" + spellid + "_includedesc",
		"repeating_spell-" + lvl + "_" + spellid + "_spelldescription",
		"repeating_spell-" + lvl + "_" + spellid + "_spellathigherlevels",
		"repeating_spell-" + lvl + "_" + spellid + "_spell_damage_progression",
		"repeating_spell-" + lvl + "_" + spellid + "_innate",
		"repeating_spell-" + lvl + "_" + spellid + "_spell_ability",
		"spellcasting_ability"], function(v) {
		var update = {};
		var description = "";
		var spellAbility = v["repeating_spell-" + lvl + "_" + spellid + "_spell_ability"] != "spell" ? v["repeating_spell-" + lvl + "_" + spellid + "_spell_ability"].slice(0, -1) : "spell";
		update["repeating_attack_" + attackid + "_atkattr_base"] = spellAbility;

		if(newattack) {
			update["repeating_attack_" + attackid + "_options-flag"] = "0";
			update["repeating_attack_" + attackid + "_spellid"] = spellid;
			update["repeating_attack_" + attackid + "_spelllevel"] = lvl;
		}

		if(v["repeating_spell-" + lvl + "_" + spellid + "_spell_ability"] == "spell") {
			update["repeating_attack_" + attackid + "_savedc"] = "(@{spell_save_dc})";
		} else if (v["repeating_spell-" + lvl + "_" + spellid + "_spell_ability"]) {
			update["repeating_attack_" + attackid + "_savedc"] = "(" + spellAbility + "+8+@{spell_dc_mod}+@{pb})";
		}

		if(v["repeating_spell-" + lvl + "_" + spellid + "_spellname"] && v["repeating_spell-" + lvl + "_" + spellid + "_spellname"] != "") {
			update["repeating_attack_" + attackid + "_atkname"] = v["repeating_spell-" + lvl + "_" + spellid + "_spellname"];
		}
		if(!v["repeating_spell-" + lvl + "_" + spellid + "_spellattack"] || v["repeating_spell-" + lvl + "_" + spellid + "_spellattack"] === "None") {
			update["repeating_attack_" + attackid + "_atkflag"] = "0";
		}
		else {
			update["repeating_attack_" + attackid + "_atkflag"] = "{{attack=1}}";
			description = description + v["repeating_spell-" + lvl + "_" + spellid + "_spellattack"] + " Spell Attack. ";
		}

		if(v["repeating_spell-" + lvl + "_" + spellid + "_spelldamage"] && v["repeating_spell-" + lvl + "_" + spellid + "_spelldamage"] != "") {
			update["repeating_attack_" + attackid + "_dmgflag"] = "{{damage=1}} {{dmg1flag=1}}";
			if(v["repeating_spell-" + lvl + "_" + spellid + "_spell_damage_progression"] && v["repeating_spell-" + lvl + "_" + spellid + "_spell_damage_progression"] === "Cantrip Dice") {
				update["repeating_attack_" + attackid + "_dmgbase"] = "[[round((@{level} + 1) / 6 + 0.5)]]" + v["repeating_spell-" + lvl + "_" + spellid + "_spelldamage"].substring(1);
			}
			else {
				update["repeating_attack_" + attackid + "_dmgbase"] = v["repeating_spell-" + lvl + "_" + spellid + "_spelldamage"];
			}
		}
		else {
			update["repeating_attack_" + attackid + "_dmgflag"] = "0"
		}
		if(v["repeating_spell-" + lvl + "_" + spellid + "_spelldmgmod"] && v["repeating_spell-" + lvl + "_" + spellid + "_spelldmgmod"] === "Yes") {
			update["repeating_attack_" + attackid + "_dmgattr"] = spellAbility;
		}
		else {
			update["repeating_attack_" + attackid + "_dmgattr"] = "0";
		}
		if(v["repeating_spell-" + lvl + "_" + spellid + "_spelldamagetype"]) {
			update["repeating_attack_" + attackid + "_dmgtype"] = v["repeating_spell-" + lvl + "_" + spellid + "_spelldamagetype"];
		}
		else {
			update["repeating_attack_" + attackid + "_dmgtype"] = "";
		}
		if(v["repeating_spell-" + lvl + "_" + spellid + "_spelldamage2"]) {
			update["repeating_attack_" + attackid + "_dmg2base"] = v["repeating_spell-" + lvl + "_" + spellid + "_spelldamage2"];
			update["repeating_attack_" + attackid + "_dmg2attr"] = 0;
			update["repeating_attack_" + attackid + "_dmg2flag"] = "{{damage=1}} {{dmg2flag=1}}";
		}
		else {
			update["repeating_attack_" + attackid + "_dmg2base"] = "";
			update["repeating_attack_" + attackid + "_dmg2attr"] = 0;
			update["repeating_attack_" + attackid + "_dmg2flag"] = "0";
		}
		if(v["repeating_spell-" + lvl + "_" + spellid + "_spelldamagetype2"]) {
			update["repeating_attack_" + attackid + "_dmg2type"] = v["repeating_spell-" + lvl + "_" + spellid + "_spelldamagetype2"];
		}
		else {
			update["repeating_attack_" + attackid + "_dmg2type"] = "";
		}
		if(v["repeating_spell-" + lvl + "_" + spellid + "_spellrange"]) {
			update["repeating_attack_" + attackid + "_atkrange"] = v["repeating_spell-" + lvl + "_" + spellid + "_spellrange"];
		}
		else {
			update["repeating_attack_" + attackid + "_atkrange"] = "";
		}
		if(v["repeating_spell-" + lvl + "_" + spellid + "_spellrange"]) {
			update["repeating_attack_" + attackid + "_atkrange"] = v["repeating_spell-" + lvl + "_" + spellid + "_spellrange"];
		}
		else {
			update["repeating_attack_" + attackid + "_atkrange"] = "";
		}
		if(v["repeating_spell-" + lvl + "_" + spellid + "_spellsave"]) {
			update["repeating_attack_" + attackid + "_saveflag"] = "{{save=1}} {{saveattr=@{saveattr}}} {{savedesc=@{saveeffect}}} {{savedc=[[[[@{savedc}]][SAVE]]]}}";
			update["repeating_attack_" + attackid + "_saveattr"] = v["repeating_spell-" + lvl + "_" + spellid + "_spellsave"];
		}
		else {
			update["repeating_attack_" + attackid + "_saveflag"] = "0";
		}
		if(v["repeating_spell-" + lvl + "_" + spellid + "_spellsavesuccess"]) {
			update["repeating_attack_" + attackid + "_saveeffect"] = v["repeating_spell-" + lvl + "_" + spellid + "_spellsavesuccess"];
		}
		else {
			update["repeating_attack_" + attackid + "_saveeffect"] = "";
		}
		if(v["repeating_spell-" + lvl + "_" + spellid + "_spellhldie"] && v["repeating_spell-" + lvl + "_" + spellid + "_spellhldie"] != "" && v["repeating_spell-" + lvl + "_" + spellid + "_spellhldietype"] && v["repeating_spell-" + lvl + "_" + spellid + "_spellhldietype"] != "") {
			var bonus = "";
			var spelllevel = v["repeating_spell-" + lvl + "_" + spellid + "_spelllevel"];
			var query = "?{Cast at what level?";
			for(i = 0; i < 10-spelllevel; i++) {
				query = query + "|Level " + (parseInt(i, 10) + parseInt(spelllevel, 10)) + "," + i;
			}
			query = query + "}";
			if(v["repeating_spell-" + lvl + "_" + spellid + "_spellhlbonus"] && v["repeating_spell-" + lvl + "_" + spellid + "_spellhlbonus"] != "") {
				bonus = "+(" + v["repeating_spell-" + lvl + "_" + spellid + "_spellhlbonus"] + "*" + query + ")";
			}
			update["repeating_attack_" + attackid + "_hldmg"] = "{{hldmg=[[(" + v["repeating_spell-" + lvl + "_" + spellid + "_spellhldie"] + "*" + query + ")" + v["repeating_spell-" + lvl + "_" + spellid + "_spellhldietype"] + bonus + "]]}}";
		}
		else {
			update["repeating_attack_" + attackid + "_hldmg"] = "";
		}
		if(v["repeating_spell-" + lvl + "_" + spellid + "_spellhealing"] && v["repeating_spell-" + lvl + "_" + spellid + "_spellhealing"] != "") {
			if(!v["repeating_spell-" + lvl + "_" + spellid + "_spelldamage"] || v["repeating_spell-" + lvl + "_" + spellid + "_spelldamage"] === "") {
				update["repeating_attack_" + attackid + "_dmgbase"] = v["repeating_spell-" + lvl + "_" + spellid + "_spellhealing"];
				update["repeating_attack_" + attackid + "_dmgflag"] = "{{damage=1}} {{dmg1flag=1}}";
				update["repeating_attack_" + attackid + "_dmgtype"] = "Healing";
			}
			else if(!v["repeating_spell-" + lvl + "_" + spellid + "_spelldamage2"] || v["repeating_spell-" + lvl + "_" + spellid + "_spelldamage2"] === "") {
				update["repeating_attack_" + attackid + "_dmg2base"] = v["repeating_spell-" + lvl + "_" + spellid + "_spellhealing"];
				update["repeating_attack_" + attackid + "_dmg2flag"] = "{{damage=1}} {{dmg2flag=1}}";
				update["repeating_attack_" + attackid + "_dmg2type"] = "Healing";
			}
		}
		if(v["repeating_spell-" + lvl + "_" + spellid + "_innate"]) {
			update["repeating_attack_" + attackid + "_spell_innate"] = v["repeating_spell-" + lvl + "_" + spellid + "_innate"];
		}
		else {
			update["repeating_attack_" + attackid + "_spell_innate"] = "";
		}
		if(v["repeating_spell-" + lvl + "_" + spellid + "_spelltarget"]) {
			description = description + v["repeating_spell-" + lvl + "_" + spellid + "_spelltarget"] + ". ";
		}
		if(v["repeating_spell-" + lvl + "_" + spellid + "_includedesc"] && v["repeating_spell-" + lvl + "_" + spellid + "_includedesc"] === "on") {
			description = v["repeating_spell-" + lvl + "_" + spellid + "_spelldescription"];
			if(v["repeating_spell-" + lvl + "_" + spellid + "_spellathigherlevels"] && v["repeating_spell-" + lvl + "_" + spellid + "_spellathigherlevels"] != "") {
				description = description + "\n\nAt Higher Levels: " + v["repeating_spell-" + lvl + "_" + spellid + "_spellathigherlevels"];
			}
		}
		else if(v["repeating_spell-" + lvl + "_" + spellid + "_includedesc"] && v["repeating_spell-" + lvl + "_" + spellid + "_includedesc"] === "off") {
			description = "";
		};
		update["repeating_attack_" + attackid + "_atk_desc"] = description;

		var callback = function() {update_attacks(attackid, "spell")};
		setAttrs(update, {silent: true}, callback);
	});
};

var update_attacks = function(update_id, source) {
	console.log("DOING UPDATE_ATTACKS: " + update_id);
	if(update_id.substring(0,1) === "-" && update_id.length === 20) {
		do_update_attack([update_id], source);
	}
	else if(["strength","dexterity","constitution","intelligence","wisdom","charisma","spells","all"].indexOf(update_id) > -1) {
		getSectionIDs("repeating_attack", function(idarray) {
			if(update_id === "all") {
				do_update_attack(idarray);
			}
			else if(update_id === "spells") {
				var attack_attribs = [];
				_.each(idarray, function(id) {
					attack_attribs.push("repeating_attack_" + id + "_spellid", "repeating_attack_" + id + "_spelllevel");
				});
				getAttrs(attack_attribs, function(v) {
					var filteredIds = _.filter(idarray, function(id) {
						return v["repeating_attack_" + id + "_spellid"] && v["repeating_attack_" + id + "_spellid"] != "";
					});
					var spell_attacks = {};
					_.each(filteredIds, function(attack_id) {
						spell_attacks[attack_id] = {
							spell_id: v["repeating_attack_" + attack_id + "_spellid"],
							spell_lvl: v["repeating_attack_" + attack_id + "_spelllevel"]
						};
					});
					_.each(spell_attacks, function(data, attack_id) { update_attack_from_spell(data.spell_lvl, data.spell_id, attack_id); });
				});

			}
			else {
				var attack_attribs = ["spellcasting_ability"];
				_.each(idarray, function(id) {
					attack_attribs.push("repeating_attack_" + id + "_atkattr_base");
					attack_attribs.push("repeating_attack_" + id + "_dmgattr");
					attack_attribs.push("repeating_attack_" + id + "_dmg2attr");
					attack_attribs.push("repeating_attack_" + id + "_savedc");
				});
				getAttrs(attack_attribs, function(v) {
					var attr_attack_ids = [];
					_.each(idarray, function(id) {
						if((v["repeating_attack_" + id + "_atkattr_base"] && v["repeating_attack_" + id + "_atkattr_base"].indexOf(update_id) > -1) || (v["repeating_attack_" + id + "_dmgattr"] && v["repeating_attack_" + id + "_dmgattr"].indexOf(update_id) > -1) || (v["repeating_attack_" + id + "_dmg2attr"] && v["repeating_attack_" + id + "_dmg2attr"].indexOf(update_id) > -1) || (v["repeating_attack_" + id + "_savedc"] && v["repeating_attack_" + id + "_savedc"].indexOf(update_id) > -1) || (v["repeating_attack_" + id + "_savedc"] && v["repeating_attack_" + id + "_savedc"] === "(@{spell_save_dc})" && v["spellcasting_ability"] && v["spellcasting_ability"].indexOf(update_id) > -1)) {
							attr_attack_ids.push(id);
						}
					});
					if(attr_attack_ids.length > 0) {
						do_update_attack(attr_attack_ids);
					}
				});
			};
		});
	};
};

var do_update_attack = function(attack_array, source) {
	var attack_attribs = ["level","d20","pb","pb_type","pbd_safe","dtype","globalmagicmod","strength_mod","dexterity_mod","constitution_mod","intelligence_mod","wisdom_mod","charisma_mod","spellcasting_ability","spell_save_dc","spell_attack_mod", "spell_dc_mod", "global_damage_mod_roll", "global_damage_mod_crit"];
	_.each(attack_array, function(attackid) {
		attack_attribs.push("repeating_attack_" + attackid + "_atkflag");
		attack_attribs.push("repeating_attack_" + attackid + "_atkname");
		attack_attribs.push("repeating_attack_" + attackid + "_atkattr_base");
		attack_attribs.push("repeating_attack_" + attackid + "_atkmod");
		attack_attribs.push("repeating_attack_" + attackid + "_atkprofflag");
		attack_attribs.push("repeating_attack_" + attackid + "_atkmagic");
		attack_attribs.push("repeating_attack_" + attackid + "_dmgflag");
		attack_attribs.push("repeating_attack_" + attackid + "_dmgbase");
		attack_attribs.push("repeating_attack_" + attackid + "_dmgattr");
		attack_attribs.push("repeating_attack_" + attackid + "_dmgmod");
		attack_attribs.push("repeating_attack_" + attackid + "_dmgtype");
		attack_attribs.push("repeating_attack_" + attackid + "_dmg2flag");
		attack_attribs.push("repeating_attack_" + attackid + "_dmg2base");
		attack_attribs.push("repeating_attack_" + attackid + "_dmg2attr");
		attack_attribs.push("repeating_attack_" + attackid + "_dmg2mod");
		attack_attribs.push("repeating_attack_" + attackid + "_dmg2type");
		attack_attribs.push("repeating_attack_" + attackid + "_dmgcustcrit");
		attack_attribs.push("repeating_attack_" + attackid + "_dmg2custcrit");
		attack_attribs.push("repeating_attack_" + attackid + "_saveflag");
		attack_attribs.push("repeating_attack_" + attackid + "_savedc");
		attack_attribs.push("repeating_attack_" + attackid + "_saveeffect");
		attack_attribs.push("repeating_attack_" + attackid + "_saveflat");
		attack_attribs.push("repeating_attack_" + attackid + "_hldmg");
		attack_attribs.push("repeating_attack_" + attackid + "_spellid");
		attack_attribs.push("repeating_attack_" + attackid + "_spelllevel");
		attack_attribs.push("repeating_attack_" + attackid + "_atkrange");
		attack_attribs.push("repeating_attack_" + attackid + "_itemid");
		attack_attribs.push("repeating_attack_" + attackid + "_ammo");
		attack_attribs.push("repeating_attack_" + attackid + "_global_damage_mod_field");
	});

	getAttrs(attack_attribs, function(v) {
		_.each(attack_array, function(attackid) {
			var callbacks = [];
			var update = {};
			var hbonus = "";
			var hdmg1 = "";
			var hdmg2 = "";
			var dmg = "";
			var dmg2 = "";
			var rollbase = "";
			var spellattack = false;
			var magicattackmod = 0;
			var magicsavemod = 0;
			var atkattr_abrev = "";
			var dmgattr_abrev = "";
			var dmg2attr_abrev = "";
			var pbd_safe = v["pbd_safe"] ? v["pbd_safe"] : "";
			var global_crit = v["repeating_attack_" + attackid + "_global_damage_mod_field"] && v["repeating_attack_" + attackid + "_global_damage_mod_field"] != "" ? "@{global_damage_mod_crit}" : "";
			var hldmgcrit = v["repeating_attack_" + attackid + "_hldmg"] && v["repeating_attack_" + attackid + "_hldmg"] != "" ? v["repeating_attack_" + attackid + "_hldmg"].slice(0, 7) + "crit" + v["repeating_attack_" + attackid + "_hldmg"].slice(7) : "";
			if(v["repeating_attack_" + attackid + "_spellid"] && v["repeating_attack_" + attackid + "_spellid"] != "") {
				spellattack = true;
				magicattackmod = v["spell_attack_mod"] && !isNaN(parseInt(v["spell_attack_mod"],10)) ? parseInt(v["spell_attack_mod"],10) : 0;
				magicsavemod = v["spell_dc_mod"] && !isNaN(parseInt(v["spell_dc_mod"],10)) ? parseInt(v["spell_dc_mod"],10) : 0;
			};

			if(!v["repeating_attack_" + attackid + "_atkattr_base"] || v["repeating_attack_" + attackid + "_atkattr_base"] === "0") {
				atkattr_base = 0
			} else if(v["repeating_attack_" + attackid + "_atkattr_base"] && v["repeating_attack_" + attackid + "_atkattr_base"] === "spell") {
				atkattr_base = parseInt(v[v["spellcasting_ability"].substring(2, v["spellcasting_ability"].length - 2)], 10);
				atkattr_abrev = v["spellcasting_ability"].substring(2, 5).toUpperCase();
			} else {
				atkattr_base = parseInt(v[v["repeating_attack_" + attackid + "_atkattr_base"].substring(2, v["repeating_attack_" + attackid + "_atkattr_base"].length - 1)], 10);
				atkattr_abrev = v["repeating_attack_" + attackid + "_atkattr_base"].substring(2, 5).toUpperCase();
			};

			if(!v["repeating_attack_" + attackid + "_dmgattr"] || v["repeating_attack_" + attackid + "_dmgattr"] === "0") {
				dmgattr = 0;
			} else if(v["repeating_attack_" + attackid + "_dmgattr"] && v["repeating_attack_" + attackid + "_dmgattr"] === "spell") {
				dmgattr = parseInt(v[v["spellcasting_ability"].substring(2, v["spellcasting_ability"].length - 2)], 10);
				dmgattr_abrev = v["spellcasting_ability"].substring(2, 5).toUpperCase();
			} else {
				dmgattr = parseInt(v[v["repeating_attack_" + attackid + "_dmgattr"].substring(2, v["repeating_attack_" + attackid + "_dmgattr"].length - 1)], 10);
				dmgattr_abrev =v["repeating_attack_" + attackid + "_dmgattr"].substring(2, 5).toUpperCase();
			};

			if(!v["repeating_attack_" + attackid + "_dmg2attr"] || v["repeating_attack_" + attackid + "_dmg2attr"] === "0") {
				dmg2attr = 0;
			} else if(v["repeating_attack_" + attackid + "_dmg2attr"] && v["repeating_attack_" + attackid + "_dmg2attr"] === "spell") {
				dmg2attr = parseInt(v[v["spellcasting_ability"].substring(2, v["spellcasting_ability"].length - 2)], 10);
				dmg2attr_abrev = v["spellcasting_ability"].substring(2, 5).toUpperCase();
			} else {
				dmg2attr = parseInt(v[v["repeating_attack_" + attackid + "_dmg2attr"].substring(2, v["repeating_attack_" + attackid + "_dmg2attr"].length - 1)], 10);
				dmg2attr_abrev =v["repeating_attack_" + attackid + "_dmg2attr"].substring(2, 5).toUpperCase();
			};

			var dmgbase = v["repeating_attack_" + attackid + "_dmgbase"] && v["repeating_attack_" + attackid + "_dmgbase"] != "" ? v["repeating_attack_" + attackid + "_dmgbase"] : 0;
			var dmg2base = v["repeating_attack_" + attackid + "_dmg2base"] && v["repeating_attack_" + attackid + "_dmg2base"] != "" ? v["repeating_attack_" + attackid + "_dmg2base"] : 0;
			var dmgmod = v["repeating_attack_" + attackid + "_dmgmod"] && isNaN(parseInt(v["repeating_attack_" + attackid + "_dmgmod"],10)) === false ? parseInt(v["repeating_attack_" + attackid + "_dmgmod"],10) : 0;
			var dmg2mod = v["repeating_attack_" + attackid + "_dmg2mod"] && isNaN(parseInt(v["repeating_attack_" + attackid + "_dmg2mod"],10)) === false ? parseInt(v["repeating_attack_" + attackid + "_dmg2mod"],10) : 0;
			var dmgtype = v["repeating_attack_" + attackid + "_dmgtype"] ? v["repeating_attack_" + attackid + "_dmgtype"] + " " : "";
			var dmg2type = v["repeating_attack_" + attackid + "_dmg2type"] ? v["repeating_attack_" + attackid + "_dmg2type"] + " " : "";
			var pb = v["repeating_attack_" + attackid + "_atkprofflag"] && v["repeating_attack_" + attackid + "_atkprofflag"] != 0 && v.pb ? v.pb : 0;
			var atkmod = v["repeating_attack_" + attackid + "_atkmod"] && v["repeating_attack_" + attackid + "_atkmod"] != "" ? parseInt(v["repeating_attack_" + attackid + "_atkmod"],10) : 0;
			var atkmag = v["repeating_attack_" + attackid + "_atkmagic"] && v["repeating_attack_" + attackid + "_atkmagic"] != "" ? parseInt(v["repeating_attack_" + attackid + "_atkmagic"],10) : 0;
			var dmgmag = isNaN(atkmag) === false && atkmag != 0 && ((v["repeating_attack_" + attackid + "_dmgflag"] && v["repeating_attack_" + attackid + "_dmgflag"] != 0) || (v["repeating_attack_" + attackid + "_dmg2flag"] && v["repeating_attack_" + attackid + "_dmg2flag"] != 0)) ? "+ " + atkmag + " Magic Bonus" : "";
			if(v["repeating_attack_" + attackid + "_atkflag"] && v["repeating_attack_" + attackid + "_atkflag"] != 0) {
				bonus_mod = atkattr_base + atkmod + atkmag + magicattackmod;
				if(v["pb_type"] && v["pb_type"] === "die") {
					plus_minus = bonus_mod > -1 ? "+" : "";
					bonus = bonus_mod + "+" + pb;
				}
				else {
					bonus_mod = bonus_mod + parseInt(pb, 10);
					plus_minus = bonus_mod > -1 ? "+" : "";
					bonus = plus_minus + bonus_mod;
				};
			}
			else if(v["repeating_attack_" + attackid + "_saveflag"] && v["repeating_attack_" + attackid + "_saveflag"] != 0) {
				if(!v["repeating_attack_" + attackid + "_savedc"] || (v["repeating_attack_" + attackid + "_savedc"] && v["repeating_attack_" + attackid + "_savedc"] === "(@{spell_save_dc})")) {
					var tempdc = v["spell_save_dc"];
				}
				else if(v["repeating_attack_" + attackid + "_savedc"] && v["repeating_attack_" + attackid + "_savedc"] === "(@{saveflat})") {
					var tempdc = isNaN(parseInt(v["repeating_attack_" + attackid + "_saveflat"])) === false ? parseInt(v["repeating_attack_" + attackid + "_saveflat"]) : "0";
				}
				else {
					var savedcattr = v["repeating_attack_" + attackid + "_savedc"].replace(/^[^{]*{/,"").replace(/\_.*$/,"");
					var safe_pb = v["pb_type"] && v["pb_type"] === "die" ? parseInt(pb.substring(1), 10) / 2 : parseInt(pb,10);
					var safe_attr = v[savedcattr + "_mod"] ? parseInt(v[savedcattr + "_mod"],10) : 0;
					var tempdc = 8 + safe_attr + safe_pb + magicsavemod;
				};
				bonus = "DC" + tempdc;
			}
			else {
				bonus = "-";
			}
			if(v["repeating_attack_" + attackid + "_dmgflag"] && v["repeating_attack_" + attackid + "_dmgflag"] != 0) {
				if(spellattack === true && dmgbase.indexOf("[[round((@{level} + 1) / 6 + 0.5)]]") > -1) {
					// SPECIAL CANTRIP DAMAGE
					dmgdiestring = Math.round(((parseInt(v["level"], 10) + 1) / 6) + 0.5).toString()
					dmg = dmgdiestring + dmgbase.substring(dmgbase.lastIndexOf("d"));
					if(dmgattr + dmgmod != 0) {
						dmg = dmg + "+" + (dmgattr + dmgmod);
					}
					dmg = dmg + " " + dmgtype;
				}
				else {
					if(dmgbase === 0 && (dmgattr + dmgmod === 0)){
						dmg = 0;
					}
					if(dmgbase != 0) {
						dmg = dmgbase;
					}
					if(dmgbase != 0 && (dmgattr + dmgmod != 0)){
						dmg = dmgattr + dmgmod > 0 ? dmg + "+" : dmg;
					}
					if(dmgattr + dmgmod != 0) {
						dmg = dmg + (dmgattr + dmgmod);
					}
					dmg = dmg + " " + dmgtype;
				}
			}
			else {
				dmg = "";
			};
			if(v["repeating_attack_" + attackid + "_dmg2flag"] && v["repeating_attack_" + attackid + "_dmg2flag"] != 0) {
				if(dmg2base === 0 && (dmg2attr + dmg2mod === 0)){
					dmg2 = 0;
				}
				if(dmg2base != 0) {
					dmg2 = dmg2base;
				}
				if(dmg2base != 0 && (dmg2attr + dmg2mod != 0)){
					dmg2 = dmg2attr + dmg2mod > 0 ? dmg2 + "+" : dmg2;
				}
				if(dmg2attr + dmg2mod != 0) {
					dmg2 = dmg2 + (dmg2attr + dmg2mod);
				}
				dmg2 = dmg2 + " " + dmg2type;
			}
			else {
				dmg2 = "";
			};
			dmgspacer = v["repeating_attack_" + attackid + "_dmgflag"] && v["repeating_attack_" + attackid + "_dmgflag"] != 0 && v["repeating_attack_" + attackid + "_dmg2flag"] && v["repeating_attack_" + attackid + "_dmg2flag"] != 0 ? "+ " : "";
			crit1 = v["repeating_attack_" + attackid + "_dmgcustcrit"] && v["repeating_attack_" + attackid + "_dmgcustcrit"] != "" ? v["repeating_attack_" + attackid + "_dmgcustcrit"] : dmgbase;
			crit2 = v["repeating_attack_" + attackid + "_dmg2custcrit"] && v["repeating_attack_" + attackid + "_dmg2custcrit"] != "" ? v["repeating_attack_" + attackid + "_dmg2custcrit"] : dmg2base;
			r1 = v["repeating_attack_" + attackid + "_atkflag"] && v["repeating_attack_" + attackid + "_atkflag"] != 0 ? "@{d20}" : "0d20";
			r2 = v["repeating_attack_" + attackid + "_atkflag"] && v["repeating_attack_" + attackid + "_atkflag"] != 0 ? "@{rtype}" : "{{r2=[[0d20";
			if(v["repeating_attack_" + attackid + "_atkflag"] && v["repeating_attack_" + attackid + "_atkflag"] != 0) {
				if(magicattackmod != 0) {hbonus = " + " + magicattackmod + "[SPELLATK]" + hbonus};
				if(atkmag != 0) {hbonus = " + " + atkmag + "[MAGIC]" + hbonus};
				if(pb != 0) {hbonus = " + " + pb + pbd_safe + "[PROF]" + hbonus};
				if(atkmod != 0) {hbonus = " + " + atkmod + "[MOD]" + hbonus};
				if(atkattr_base != 0) {hbonus = " + " + atkattr_base + "[" + atkattr_abrev + "]" + hbonus};
			}
			else {
				hbonus = "";
			}
			if(v["repeating_attack_" + attackid + "_dmgflag"] && v["repeating_attack_" + attackid + "_dmgflag"] != 0) {
				if(atkmag != 0) {hdmg1 = " + " + atkmag + "[MAGIC]" + hdmg1};
				if(dmgmod != 0) {hdmg1 = " + " + dmgmod + "[MOD]" + hdmg1};
				if(dmgattr != 0) {hdmg1 = " + " + dmgattr + "[" + dmgattr_abrev + "]" + hdmg1};
				hdmg1 = dmgbase + hdmg1;
			}
			else {
				hdmg1 = "0";
			}
			if(v["repeating_attack_" + attackid + "_dmg2flag"] && v["repeating_attack_" + attackid + "_dmg2flag"] != 0) {
				if(dmg2mod != 0) {hdmg2 = " + " + dmg2mod + "[MOD]" + hdmg2};
				if(dmg2attr != 0) {hdmg2 = " + " + dmg2attr + "[" + dmg2attr_abrev + "]" + hdmg2};
				hdmg2 = dmg2base + hdmg2;
			}
			else {
				hdmg2 = "0";
			}
			var globaldamage = `[[${v.global_damage_mod_roll && v.global_damage_mod_roll !== "" ? v.global_damage_mod_roll : "0"}]]`;
			var globaldamagecrit = `[[${v.global_damage_mod_crit && v.global_damage_mod_crit !== "" ? v.global_damage_mod_crit : "0"}]]`;
			if(v.dtype === "full") {
				pickbase = "full";
				rollbase = "@{wtype}&{template:atkdmg} {{mod=@{atkbonus}}} {{rname=@{atkname}}} {{r1=[[" + r1 + "cs>@{atkcritrange}" + hbonus + "]]}} " + r2 + "cs>@{atkcritrange}" + hbonus + "]]}} @{atkflag} {{range=@{atkrange}}} @{dmgflag} {{dmg1=[[" + hdmg1 + "]]}} {{dmg1type=" + dmgtype + "}} @{dmg2flag} {{dmg2=[[" + hdmg2 + "]]}} {{dmg2type=" + dmg2type + "}} {{crit1=[[" + crit1 + "[CRIT]]]}} {{crit2=[[" + crit2 + "[CRIT]]]}} @{saveflag} {{desc=@{atk_desc}}} @{hldmg} " + hldmgcrit + " {{spelllevel=@{spelllevel}}} {{innate=@{spell_innate}}} {{globalattack=@{global_attack_mod}}} {{globaldamage=" + globaldamage + "}} {{globaldamagecrit=" + globaldamagecrit + "}} {{globaldamagetype=@{global_damage_mod_type}}} ammo=@{ammo} @{charname_output}";
			}
			else if(v["repeating_attack_" + attackid + "_atkflag"] && v["repeating_attack_" + attackid + "_atkflag"] != 0) {
				pickbase = "pick";
				rollbase = "@{wtype}&{template:atk} {{mod=@{atkbonus}}} {{rname=[@{atkname}](~repeating_attack_attack_dmg)}} {{rnamec=[@{atkname}](~repeating_attack_attack_crit)}} {{r1=[[" + r1 + "cs>@{atkcritrange}" + hbonus + "]]}} " + r2 + "cs>@{atkcritrange}" + hbonus + "]]}} {{range=@{atkrange}}} {{desc=@{atk_desc}}} {{spelllevel=@{spelllevel}}} {{innate=@{spell_innate}}} {{globalattack=@{global_attack_mod}}} ammo=@{ammo} @{charname_output}";
			}
			else if(v["repeating_attack_" + attackid + "_dmgflag"] && v["repeating_attack_" + attackid + "_dmgflag"] != 0) {
				pickbase = "dmg";
				rollbase = "@{wtype}&{template:dmg} {{rname=@{atkname}}} @{atkflag} {{range=@{atkrange}}} @{dmgflag} {{dmg1=[[" + hdmg1 + "]]}} {{dmg1type=" + dmgtype + "}} @{dmg2flag} {{dmg2=[[" + hdmg2 + "]]}} {{dmg2type=" + dmg2type + "}} @{saveflag} {{desc=@{atk_desc}}} @{hldmg} {{spelllevel=@{spelllevel}}} {{innate=@{spell_innate}}} {{globaldamage=" + globaldamage + "}} {{globaldamagetype=@{global_damage_mod_type}}} ammo=@{ammo} @{charname_output}"
			}
			else {
				pickbase = "empty";
				rollbase = "@{wtype}&{template:dmg} {{rname=@{atkname}}} @{atkflag} {{range=@{atkrange}}} @{saveflag} {{desc=@{atk_desc}}} {{spelllevel=@{spelllevel}}} {{innate=@{spell_innate}}} ammo=@{ammo} @{charname_output}"
			}
			update["repeating_attack_" + attackid + "_rollbase_dmg"] = "@{wtype}&{template:dmg} {{rname=@{atkname}}} @{atkflag} {{range=@{atkrange}}} @{dmgflag} {{dmg1=[[" + hdmg1 + "]]}} {{dmg1type=" + dmgtype + "}} @{dmg2flag} {{dmg2=[[" + hdmg2 + "]]}} {{dmg2type=" + dmg2type + "}} @{saveflag} {{desc=@{atk_desc}}} @{hldmg} {{spelllevel=@{spelllevel}}} {{innate=@{spell_innate}}} {{globaldamage=" + globaldamage + "}} {{globaldamagetype=@{global_damage_mod_type}}} @{charname_output}";
			update["repeating_attack_" + attackid + "_rollbase_crit"] = "@{wtype}&{template:dmg} {{crit=1}} {{rname=@{atkname}}} @{atkflag} {{range=@{atkrange}}} @{dmgflag} {{dmg1=[[" + hdmg1 + "]]}} {{dmg1type=" + dmgtype + "}} @{dmg2flag} {{dmg2=[[" + hdmg2 + "]]}} {{dmg2type=" + dmg2type + "}} {{crit1=[[" + crit1 + "]]}} {{crit2=[[" + crit2 + "]]}} @{saveflag} {{desc=@{atk_desc}}} @{hldmg} " + hldmgcrit + " {{spelllevel=@{spelllevel}}} {{innate=@{spell_innate}}} {{globaldamage=" + globaldamage + "}} {{globaldamagecrit=" + globaldamagecrit + "}} {{globaldamagetype=@{global_damage_mod_type}}} @{charname_output}"
			update["repeating_attack_" + attackid + "_atkbonus"] = bonus;
			update["repeating_attack_" + attackid + "_atkdmgtype"] = dmg + dmgspacer + dmg2 + dmgmag + " ";
			update["repeating_attack_" + attackid + "_rollbase"] = rollbase;
			if(v["repeating_attack_" + attackid + "_spellid"] && v["repeating_attack_" + attackid + "_spellid"] != "" && (!source || source && source != "spell") && v["repeating_attack_" + attackid + "_spellid"].length == 20) {
				var spellid = v["repeating_attack_" + attackid + "_spellid"];
				var lvl = v["repeating_attack_" + attackid + "_spelllevel"];
				callbacks.push( function() {update_spell_from_attack(lvl, spellid, attackid);} );
			}
			if(v["repeating_attack_" + attackid + "_itemid"] && v["repeating_attack_" + attackid + "_itemid"] != "" && (!source || source && source != "item")) {
				var itemid = v["repeating_attack_" + attackid + "_itemid"];
				callbacks.push( function() {update_item_from_attack(itemid, attackid);} );
			}
			setAttrs(update, {silent: true}, function() {callbacks.forEach(function(callback) {callback(); })} );
		});
	});
};

var update_spell_from_attack = function(lvl, spellid, attackid) {
	var update = {};
	getAttrs(["repeating_attack_" + attackid + "_atkname", "repeating_attack_" + attackid + "_atkrange", "repeating_attack_" + attackid + "_atkflag", "repeating_attack_" + attackid + "_atkattr_base", "repeating_attack_" + attackid + "_dmgbase", "repeating_attack_" + attackid + "_dmgtype", "repeating_attack_" + attackid + "_dmg2base", "repeating_attack_" + attackid + "_dmg2type", "repeating_attack_" + attackid + "_saveflag", "repeating_attack_" + attackid + "_saveattr", "repeating_attack_" + attackid + "_saveeffect"], function(v) {
		update["repeating_spell-" + lvl + "_" + spellid + "_spellname"] = v["repeating_attack_" + attackid + "_atkname"];
		if(v["repeating_attack_" + attackid + "_atkrange"] && v["repeating_attack_" + attackid + "_atkrange"] != "") {
			update["repeating_spell-" + lvl + "_" + spellid + "_spellrange"] = v["repeating_attack_" + attackid + "_atkrange"];
		}
		else {
			update["repeating_spell-" + lvl + "_" + spellid + "_spellrange"] = "";
		};

		if(v["repeating_attack_" + attackid + "_dmgtype"] && v["repeating_attack_" + attackid + "_dmgtype"].toLowerCase() == "healing") {
			if(v["repeating_attack_" + attackid + "_dmgbase"] && v["repeating_attack_" + attackid + "_dmgbase"] != "") {
				update["repeating_spell-" + lvl + "_" + spellid + "_spellhealing"] = v["repeating_attack_" + attackid + "_dmgbase"];
			}
		}
		else {
			if(v["repeating_attack_" + attackid + "_dmgbase"] && v["repeating_attack_" + attackid + "_dmgbase"] != "" && v["repeating_attack_" + attackid + "_dmgbase"].indexOf("[[round((@{level} + 1) / 6 + 0.5)]]") === -1) {
				update["repeating_spell-" + lvl + "_" + spellid + "_spelldamage"] = v["repeating_attack_" + attackid + "_dmgbase"];
			}
			else if(!v["repeating_attack_" + attackid + "_dmgbase"] || v["repeating_attack_" + attackid + "_dmgbase"] === "") {
				update["repeating_spell-" + lvl + "_" + spellid + "_spelldamage"] = "";
			}
			if(v["repeating_attack_" + attackid + "_dmgtype"] && v["repeating_attack_" + attackid + "_dmgtype"] != "") {
				update["repeating_spell-" + lvl + "_" + spellid + "_spelldamagetype"] = v["repeating_attack_" + attackid + "_dmgtype"];
			}
			else {
				update["repeating_spell-" + lvl + "_" + spellid + "_spelldamagetype"] = "";
			}
		};
		if(v["repeating_attack_" + attackid + "_dmg2type"] && v["repeating_attack_" + attackid + "_dmg2type"].toLowerCase() == "healing") {
			if(v["repeating_attack_" + attackid + "_dmgbase"] && v["repeating_attack_" + attackid + "_dmgbase"] != "") {
				update["repeating_spell-" + lvl + "_" + spellid + "_spellhealing"] = v["repeating_attack_" + attackid + "_dmgbase"];
			}
		}
		else {
			if(v["repeating_attack_" + attackid + "_dmg2base"] && v["repeating_attack_" + attackid + "_dmg2base"] != "") {
				update["repeating_spell-" + lvl + "_" + spellid + "_spelldamage2"] = v["repeating_attack_" + attackid + "_dmg2base"];
			}
			else {
				update["repeating_spell-" + lvl + "_" + spellid + "_spelldamage2"] = "";
			}
			if(v["repeating_attack_" + attackid + "_dmg2type"] && v["repeating_attack_" + attackid + "_dmg2type"] != "") {
				update["repeating_spell-" + lvl + "_" + spellid + "_spelldamagetype2"] = v["repeating_attack_" + attackid + "_dmg2type"];
			}
			else {
				update["repeating_spell-" + lvl + "_" + spellid + "_spelldamagetype2"] = "";
			}
		};

		if(v["repeating_attack_" + attackid + "_saveflag"] && v["repeating_attack_" + attackid + "_saveflag"] != "0") {
			update["repeating_spell-" + lvl + "_" + spellid + "_spellsave"] = v["repeating_attack_" + attackid + "_saveattr"];
		}
		else {
			update["repeating_spell-" + lvl + "_" + spellid + "_spellsave"] = "";
		};
		if(v["repeating_attack_" + attackid + "_saveeffect"] && v["repeating_attack_" + attackid + "_saveeffect"] != "") {
			update["repeating_spell-" + lvl + "_" + spellid + "_spellsavesuccess"] = v["repeating_attack_" + attackid + "_saveeffect"];
		}
		else {
			update["repeating_spell-" + lvl + "_" + spellid + "_spellsavesuccess"] = "";
		};
		setAttrs(update, {silent: true});
	});
};

var update_item_from_attack = function(itemid, attackid) {
	getAttrs(["repeating_attack_" + attackid + "_atkname", "repeating_attack_" + attackid + "_dmgbase", "repeating_attack_" + attackid + "_dmg2base", "repeating_attack_" + attackid + "_dmgtype", "repeating_attack_" + attackid + "_dmg2type", "repeating_attack_" + attackid + "_atkrange", "repeating_attack_" + attackid + "_atkmod", "repeating_attack_" + attackid + "_dmgmod", "repeating_inventory_" + itemid + "_itemmodifiers", "repeating_attack_" + attackid + "_versatile_alt", "repeating_inventory_" + itemid + "_itemproperties", "repeating_attack_" + attackid + "_atkmagic"], function(v) {
		var update = {};
		var mods = v["repeating_inventory_" + itemid + "_itemmodifiers"];
		var damage = v["repeating_attack_" + attackid + "_dmgbase"] ? v["repeating_attack_" + attackid + "_dmgbase"] : 0;
		var damage2 = v["repeating_attack_" + attackid + "_dmg2base"] ? v["repeating_attack_" + attackid + "_dmg2base"] : 0;
		var damagetype = v["repeating_attack_" + attackid + "_dmgtype"] ? v["repeating_attack_" + attackid + "_dmgtype"] : 0;
		var damagetype2 = v["repeating_attack_" + attackid + "_dmg2type"] ? v["repeating_attack_" + attackid + "_dmg2type"] : 0;
		var range = v["repeating_attack_" + attackid + "_atkrange"] ? v["repeating_attack_" + attackid + "_atkrange"] : 0;
		var attackmod = v["repeating_attack_" + attackid + "_atkmod"] ? v["repeating_attack_" + attackid + "_atkmod"] : 0;
		var damagemod = v["repeating_attack_" + attackid + "_dmgmod"] ? v["repeating_attack_" + attackid + "_dmgmod"] : 0;
		var magicmod = v["repeating_attack_" + attackid + "_atkmagic"] ? v["repeating_attack_" + attackid + "_atkmagic"] : 0;
		var atktype = "";
		var altprefix = v["repeating_attack_" + attackid + "_versatile_alt"] === "1" ? "Alternate " : "";

		if(/Alternate Damage:/i.test(v["repeating_inventory_" + itemid + "_itemmodifiers"])) {
			update["repeating_inventory_" + itemid + "_itemname"] = v["repeating_attack_" + attackid + "_atkname"].replace(/\s*(?:\(One-Handed\)|\(Two-Handed\))/, "");
		} else {
			update["repeating_inventory_" + itemid + "_itemname"] = v["repeating_attack_" + attackid + "_atkname"];
		}

		var attack_type_regex = /(?:^|,)\s*Item Type: (Melee|Ranged) Weapon(?:,|$)/i;
		var attack_type_results = attack_type_regex.exec(v["repeating_inventory_" + itemid + "_itemmodifiers"]);
		atktype = attack_type_results ? attack_type_results[1] : "";
		if(mods) {
			mods = mods.split(",");
		} else {
			mods = [];
		}

		var damage_regex = new RegExp("^\\s*" + altprefix + "Damage:\\s*(.+)$", "i");
		var damage_found = false;
		for(var i = 0; i < mods.length; i++) {
			if(damage_found = damage_regex.exec(mods[i])) {
				if(damage !== 0) {
					mods[i] = mods[i].replace(damage_found[1], damage);
				} else {
					mods.splice(i, 1);
				}
				break;
			}
		}
		if(!damage_found && damage !== 0) {
			mods.push(altprefix + "Damage: " + damage);
		}

		var damage2_regex = new RegExp("^\\s*" + altprefix + "Secondary Damage:\\s*(.+)$", "i");
		var damage2_found = false;
		for(var i = 0; i < mods.length; i++) {
			if(damage2_found = damage2_regex.exec(mods[i])) {
				if(damage2 !== 0) {
					mods[i] = mods[i].replace(damage2_found[1], damage2);
				} else {
					mods.splice(i, 1);
				}
				break;
			}
		}
		if(!damage2_found && damage2 !== 0) {
			mods.push(altprefix + "Secondary Damage: " + damage2);
		}

		var dmgtype_regex = new RegExp("^\\s*" + altprefix + "Damage Type:\\s*(.+)$", "i");
		var dmgtype_found = false;
		for(var i = 0; i < mods.length; i++) {
			if(dmgtype_found = dmgtype_regex.exec(mods[i])) {
				if(damagetype !== 0) {
					mods[i] = mods[i].replace(dmgtype_found[1], damagetype);
				} else {
					mods.splice(i, 1);
				}
				break;
			}
		}
		if(!dmgtype_found && damagetype !== 0) {
			mods.push(altprefix + "Damage Type: " + damagetype);
		}

		var dmgtype2_regex = new RegExp("^\\s*" + altprefix + "Secondary Damage Type:\\s*(.+)$", "i");
		var dmgtype2_found = false;
		for(var i = 0; i < mods.length; i++) {
			if(dmgtype2_found = dmgtype2_regex.exec(mods[i])) {
				if(damagetype2 !== 0) {
					mods[i] = mods[i].replace(dmgtype_found[1], damagetype);
				} else {
					mods.splice(i, 1);
				}
				break;
			}
		}
		if(!dmgtype2_found && damagetype2 !== 0) {
			mods.push(altprefix + "Secondary Damage Type: " + damagetype2);
		}

		var range_found = false;
		for(var i = 0; i < mods.length; i++) {
			if(range_found = /^\s*Range:\s*(.+)$/i.exec(mods[i])) {
				if(range !== 0) {
					mods[i] = mods[i].replace(range_found[1], range);
				} else {
					mods.splice(i, 1);
				}
				break;
			}
		}
		if(!range_found && range !== 0) {
			mods.push("Range: " + range);
		}

		var attackmod_regex = new RegExp("^\\s*(?:" + (atktype !== "" ? atktype + "|" : "") + "Weapon) Attacks \\+?(.+)$", "i");
		var attackmod_found = false;
		for(var i = 0; i < mods.length; i++) {
			if(attackmod_found = attackmod_regex.exec(mods[i])) {
				if(magicmod !== 0 || attackmod !== 0) {
					mods[i] = mods[i].replace(attackmod_found[1], magicmod !== 0 ? magicmod : attackmod);
				} else {
					mods.splice(i, 1);
				}
				break;
			}
		}
		if(!attackmod_found && (magicmod !== 0 || attackmod !== 0)) {
			var properties = v["repeating_inventory_" + itemid + "_itemproperties"];
			if(properties && /Thrown/i.test(properties)) {
				mods.push("Weapon Attacks: " + (magicmod !== 0 ? magicmod : attackmod));
			}
			else {
				mods.push(atktype + " Attacks: " + (magicmod !== 0 ? magicmod : attackmod));
			}
		}

		var damagemod_regex = new RegExp("^\\s*(?:" + (atktype !== "" ? atktype + "|" : "") + "Weapon) Damage \\+?(.+)$", "i");
		var damagemod_found = false;
		for(var i = 0; i < mods.length; i++) {
			if(damagemod_found = damagemod_regex.exec(mods[i])) {
				if(magicmod !== 0 || damagemod !== 0) {
					mods[i] = mods[i].replace(damagemod_found[1], magicmod !== 0 ? magicmod : attackmod);
				} else {
					mods.splice(i, 1);
				}
				break;
			}
		}
		if(!damagemod_found && (magicmod !== 0 || damagemod !== 0)) {
			var properties = v["repeating_inventory_" + itemid + "_itemproperties"];
			if(properties && /Thrown/i.test(properties)) {
				mods.push("Weapon Damage: " + (magicmod !== 0 ? magicmod : damagemod));
			}
			else {
				mods.push(atktype + " Damage: " + (magicmod !== 0 ? magicmod : damagemod));
			}
		}

		update["repeating_inventory_" + itemid + "_itemmodifiers"] = mods.join(",");

		setAttrs(update, {silent: true});
	});
};

var remove_attack = function(attackid) {
	removeRepeatingRow("repeating_attack_" + attackid);
};

var remove_resource = function(id) {
	var update = {};
	getAttrs([id + "_itemid"], function(v) {
		var itemid = v[id + "_itemid"];
		if(itemid) {
			update["repeating_inventory_" + itemid + "_useasresource"] = 0;
			update["repeating_inventory_" + itemid + "_itemresourceid"] = "";
		};
		if(id == "other_resource") {
			update["other_resource"] = "";
			update["other_resource_name"] = "";
			update["other_resource_itemid"] = "";
			setAttrs(update, {silent: true});
		}
		else {
			var baseid = id.replace("repeating_resource_", "").substring(0,20);
			var resource_names = ["repeating_resource_" + baseid + "_resource_left_name", "repeating_resource_" + baseid + "_resource_right_name"];
			getAttrs(resource_names, function(v) {
				if((id.indexOf("left") > -1 && !v["repeating_resource_" + baseid + "_resource_right_name"]) || (id.indexOf("right") > -1 && !v["repeating_resource_" + baseid + "_resource_left_name"])) {
					removeRepeatingRow("repeating_resource_" + baseid);
				}
				else {
					update["repeating_resource_" + id.replace("repeating_resource_", "")] = "";
					update["repeating_resource_" + id.replace("repeating_resource_", "") + "_name"] = "";
				};
				setAttrs(update, {silent: true});
			});

		};
	});
};

var update_weight = function() {
	var update = {};
	var wtotal = 0;
	var stotal = 0; // ITEM SLOTS
	var weight_attrs = ["cp", "sp", "ep", "gp", "pp", "currency_value", "encumberance_setting", "strength", "strength_mod", "size", "carrying_capacity_mod", "inventory_slots_mod", "use_inventory_slots", "itemweightfixed", "itemslotsfixed"];
	getSectionIDs("repeating_inventory", function(idarray) {
		_.each(idarray, function(currentID, i) {
			weight_attrs.push("repeating_inventory_" + currentID + "_itemweight");
			weight_attrs.push("repeating_inventory_" + currentID + "_itemcount");
			weight_attrs.push("repeating_inventory_" + currentID + "_itemsize");
			weight_attrs.push("repeating_inventory_" + currentID + "_equipped");
			weight_attrs.push("repeating_inventory_" + currentID + "_carried");
			weight_attrs.push("repeating_inventory_" + currentID + "_itemcontainer");
			weight_attrs.push("repeating_inventory_" + currentID + "_itemweightfixed");
			weight_attrs.push("repeating_inventory_" + currentID + "_itemslotsfixed");
			weight_attrs.push("repeating_inventory_" + currentID + "_itemcontainer_slots_modifier");
		});
		getAttrs(weight_attrs, function(v) {
			cp = isNaN(parseInt(v.cp, 10)) === false ? parseInt(v.cp, 10) : 0;
			sp = isNaN(parseInt(v.sp, 10)) === false ? parseInt(v.sp, 10) : 0;
			ep = isNaN(parseInt(v.ep, 10)) === false ? parseInt(v.ep, 10) : 0;
			gp = isNaN(parseInt(v.gp, 10)) === false ? parseInt(v.gp, 10) : 0;
			pp = isNaN(parseInt(v.pp, 10)) === false ? parseInt(v.pp, 10) : 0;
			currencyOther = isNaN(parseInt(v.currency_value, 10)) === false ? parseInt(v.currency_value, 10) : 0;
			wtotal = wtotal + ((cp + sp + ep + gp + pp + currencyOther) / 50);
			stotal += Math.floor(Math.max(0, cp + sp + ep + gp + pp + currencyOther - 1) / 100);
			var slots_modifier = 0;

			_.each(idarray, function(currentID, i) {
				if (v["repeating_inventory_" + currentID + "_equipped"] == 1 || v["repeating_inventory_" + currentID + "_carried"] == 1) {
					if (v["repeating_inventory_" + currentID + "_itemcontainer"] == 1) {
						// GET SLOTS MODIFIER IF EQUIPPED
						if (v["repeating_inventory_" + currentID + "_equipped"] == 1) {
							var field_id = "repeating_inventory_" + currentID + "_itemcontainer_slots_modifier";
							if (v[field_id]) {
								if (["+", "-"].indexOf(v[field_id]) > -1) {
									var operator = v[field_id].substring(0, 1);
									var value = v[field_id].substring(1);
									if (isNaN(parseInt(value, 10)) === false) {
										if (operator == "+") {
											slots_modifier += parseInt(value, 10);
										} else if (operator == "-") {
											slots_modifier -= parseInt(value, 10);
										}
									}
								} else {
									if (isNaN(parseInt(v[field_id], 10)) === false) {
										slots_modifier += parseInt(v[field_id], 10);
									}
								}
							}
						}
					} else {
						// UPDATE WEIGHT
						if (v["repeating_inventory_" + currentID + "_itemweight"] && isNaN(parseInt(v["repeating_inventory_" + currentID + "_itemweight"], 10)) === false) {
							if (v["repeating_inventory_" + currentID + "_itemweightfixed"] == 1) {
								wtotal += parseFloat(v["repeating_inventory_" + currentID + "_itemweight"]);
							} else {
								count = v["repeating_inventory_" + currentID + "_itemcount"] && isNaN(parseFloat(v["repeating_inventory_" + currentID + "_itemcount"])) === false ? parseFloat(v["repeating_inventory_" + currentID + "_itemcount"]) : 1;
								wtotal = wtotal + (parseFloat(v["repeating_inventory_" + currentID + "_itemweight"]) * count);
							}
						}
						// UPDATE SLOTS
						if (v["repeating_inventory_" + currentID + "_itemsize"] && isNaN(parseInt(v["repeating_inventory_" + currentID + "_itemsize"], 10)) === false) {
							if (v["repeating_inventory_" + currentID + "_itemslotsfixed"] == 1) {
								stotal += parseFloat(v["repeating_inventory_" + currentID + "_itemsize"]);
							} else {
								count = v["repeating_inventory_" + currentID + "_itemcount"] && isNaN(parseFloat(v["repeating_inventory_" + currentID + "_itemcount"])) === false ? parseFloat(v["repeating_inventory_" + currentID + "_itemcount"]) : 1;
								stotal = stotal + (parseFloat(v["repeating_inventory_" + currentID + "_itemsize"]) * count);
							}
						}
					}
				}
			});

			// CAP TOTALS AT 2 DECIMAL PLACES
			wtotal = Math.round(wtotal * 100) / 100;
			stotal = Math.round(stotal * 100) / 100;

			update["weighttotal"] = wtotal;
			update["slotstotal"] = stotal;

			if (v["use_inventory_slots"] == 1) {

				var size_slots = 18;
				if (v["size"] && v["size"] != "") {
					if (v["size"].toLowerCase().trim() == "tiny") {
						size_slots = 9
					} else if (v["size"].toLowerCase().trim() == "small") {
						size_slots = 15
					} else if (v["size"].toLowerCase().trim() == "large") {
						size_slots = 21
					} else if (v["size"].toLowerCase().trim() == "huge") {
						size_slots = 27
					} else if (v["size"].toLowerCase().trim() == "gargantuan") {
						size_slots = 39
					}
				}

				size_slots += parseInt(v.strength_mod, 10);

				if (v.inventory_slots_mod) {
					var operator = v.inventory_slots_mod.substring(0, 1);
					var value = v.inventory_slots_mod.substring(1);
					if (["*", "x", "+", "-"].indexOf(operator) > -1 && isNaN(parseInt(value, 10)) === false) {
						if (operator == "*" || operator == "x") {
							size_slots *= parseInt(value, 10);
						} else if (operator == "+") {
							size_slots += parseInt(value, 10);
						} else if (operator == "-") {
							size_slots -= parseInt(value, 10);
						}
					}
				}

				size_slots += slots_modifier;

				update["slotsmaximum"] = size_slots;
				if (stotal > size_slots) {
					update["encumberance"] = "OVER CARRYING CAPACITY";
				} else {
					update["encumberance"] = " ";
				}

			} else {

				var str_base = parseInt(v.strength, 10);
				var size_multiplier = 1;
				if (v["size"] && v["size"] != "") {
					if (v["size"].toLowerCase().trim() == "tiny") {
						size_multiplier = .5
					} else if (v["size"].toLowerCase().trim() == "large") {
						size_multiplier = 2
					} else if (v["size"].toLowerCase().trim() == "huge") {
						size_multiplier = 4
					} else if (v["size"].toLowerCase().trim() == "gargantuan") {
						size_multiplier = 8
					}
				}
				var str = str_base * size_multiplier;
				if (v.carrying_capacity_mod) {
					var operator = v.carrying_capacity_mod.substring(0, 1);
					var value = v.carrying_capacity_mod.substring(1);
					if (["*", "x", "+", "-"].indexOf(operator) > -1 && isNaN(parseInt(value, 10)) === false) {
						if (operator == "*" || operator == "x") {
							str *= parseInt(value, 10);
						} else if (operator == "+") {
							str += parseInt(value, 10);
						} else if (operator == "-") {
							str -= parseInt(value, 10);
						}
					}
				}

				update["weightmaximum"] = str * 15;
				if (!v.encumberance_setting || v.encumberance_setting === "off") {
					if (wtotal > str * 15) {
						update["encumberance"] = "OVER CARRYING CAPACITY";
					} else {
						update["encumberance"] = " ";
					}
				} else if (v.encumberance_setting === "on") {
					if (wtotal > str * 15) {
						update["encumberance"] = "IMMOBILE";
					} else if (wtotal > str * 10) {
						update["encumberance"] = "HEAVILY ENCUMBERED";
					} else if (wtotal > str * 5) {
						update["encumberance"] = "ENCUMBERED";
					} else {
						update["encumberance"] = " ";
					}
				} else {
					update["encumberance"] = " ";
				}
			}

			setAttrs(update, {
				silent: true
			});
		});
	});
};

var update_ac = function() {
	getAttrs(["custom_ac_flag"], function(v) {
		if(v.custom_ac_flag === "2") {
			return;
		}
		else {
			var update = {};
			var ac_attrs = ["simpleinventory","custom_ac_base","custom_ac_part1","custom_ac_part2","strength_mod","dexterity_mod","constitution_mod","intelligence_mod","wisdom_mod","charisma_mod", "custom_ac_shield"];
			getSectionIDs("repeating_acmod", function(acidarray) {
				_.each(acidarray, function(currentID, i) {
					ac_attrs.push("repeating_acmod_" + currentID + "_global_ac_val");
					ac_attrs.push("repeating_acmod_" + currentID + "_global_ac_active_flag");
				});
				getSectionIDs("repeating_inventory", function(idarray) {
					_.each(idarray, function(currentID, i) {
						ac_attrs.push("repeating_inventory_" + currentID + "_equipped");
						ac_attrs.push("repeating_inventory_" + currentID + "_itemmodifiers");
					});
					getAttrs(ac_attrs, function(b) {
						var custom_total = 0;
						if(v.custom_ac_flag === "1") {
							var base = isNaN(parseInt(b.custom_ac_base, 10)) === false ? parseInt(b.custom_ac_base, 10) : 10;
							var part1attr = b.custom_ac_part1.toLowerCase();
							var part2attr = b.custom_ac_part2.toLowerCase();
							var part1 = part1attr === "none" ? 0 : parseInt(b[part1attr + "_mod"], 10);
							var part2 = part2attr === "none" ? 0 : parseInt(b[part2attr + "_mod"], 10);
							custom_total = base + part1 + part2;
						}
						var globalacmod = 0;
						_.each(acidarray, function(currentID, i) {
							if(b["repeating_acmod_" + currentID + "_global_ac_active_flag"] == "1") {
								globalacmod += parseInt(b["repeating_acmod_" + currentID + "_global_ac_val"], 10);
							}
						});
						var dexmod = +b["dexterity_mod"];
						var total = 10 + dexmod;
						var armorcount = 0;
						var shieldcount = 0;
						var armoritems = [];
						if(b.simpleinventory === "complex") {
							_.each(idarray, function(currentID, i) {
								if(b["repeating_inventory_" + currentID + "_equipped"] && b["repeating_inventory_" + currentID + "_equipped"] === "1" && b["repeating_inventory_" + currentID + "_itemmodifiers"] && b["repeating_inventory_" + currentID + "_itemmodifiers"].toLowerCase().indexOf("ac") > -1) {
									var mods = b["repeating_inventory_" + currentID + "_itemmodifiers"].split(",");
									var ac = 0;
									var type = "mod";
									_.each(mods, function(mod) {
										if(mod.substring(0,10) === "Item Type:") {
											type = mod.substring(11, mod.length).trim().toLowerCase();
										}
										if(mod.toLowerCase().indexOf("ac:") > -1 || mod.toLowerCase().indexOf("ac +") > -1 || mod.toLowerCase().indexOf("ac+") > -1) {
											var regex = mod.replace(/[^0-9]/g, "");
											var bonus = regex && regex.length > 0 && isNaN(parseInt(regex,10)) === false ? parseInt(regex,10) : 0;
											ac = ac + bonus;
										}
										if(mod.toLowerCase().indexOf("ac -") > -1 || mod.toLowerCase().indexOf("ac-") > -1) {
											var regex = mod.replace(/[^0-9]/g, "");
											var bonus = regex && regex.length > 0 && isNaN(parseInt(regex,10)) === false ? parseInt(regex,10) : 0;
											ac = ac - bonus;
										}
									});
									armoritems.push({type: type, ac: ac});
								}
							});
							armorcount = armoritems.filter(function(item){ return item["type"].indexOf("armor") > -1 }).length;
							shieldcount = armoritems.filter(function(item){ return item["type"].indexOf("shield") > -1 }).length;
							var base = dexmod;
							var armorac = 10;
							var shieldac = 0;
							var modac = 0;

							_.each(armoritems, function(item) {
								if(item["type"].indexOf("light armor") > -1) {
									armorac = item["ac"];
									base = dexmod;
								}
								else if(item["type"].indexOf("medium armor") > -1) {
									armorac = item["ac"];
									base = Math.min(dexmod, 2);
								}
								else if(item["type"].indexOf("heavy armor") > -1) {
									armorac = item["ac"];
									base = 0;
								}
								else if(item["type"].indexOf("shield") > -1) {
									shieldac = item["ac"];
								}
								else {
									modac = modac + item["ac"]
								}
							});

							total = base + armorac + shieldac + modac;

						};
						update["armorwarningflag"] = "hide";
						update["customacwarningflag"] = "hide";
						if(armorcount > 1 || shieldcount > 1) {
							update["armorwarningflag"] = "show";
						}
						update["ac"] = total + globalacmod;
						if(custom_total > 0) {
							if(armorcount > 0 || (shieldcount > 0 && b.custom_ac_shield != "yes")) {
								update["customacwarningflag"] = "show";
							}
							else {
								update["ac"] = b.custom_ac_shield == "yes" ? custom_total + shieldac + globalacmod + modac : custom_total + globalacmod + modac;
							}
						}
						console.log("total: " + total);
						setAttrs(update, {silent: true});
					});
				});
			});
		};
	});
};

var check_customac = function(attr) {
	getAttrs(["custom_ac_flag","custom_ac_part1","custom_ac_part2"], function(v) {
		if(v["custom_ac_flag"] && v["custom_ac_flag"] === "1" && ((v["custom_ac_part1"] && v["custom_ac_part1"] === attr) || (v["custom_ac_part2"] && v["custom_ac_part2"] === attr))) {
			update_ac();
		}
	});
};

var update_initiative = function() {
	var attrs_to_get = ["dexterity","dexterity_mod","intelligence_mod","initmod","jack_of_all_trades","jack","init_tiebreaker","pb_type","use_intelligent_initiative"];
	getSectionIDs("repeating_inventory", function(idarray){
		_.each(idarray, function(currentID, i) {
			attrs_to_get.push("repeating_inventory_" + currentID + "_equipped");
			attrs_to_get.push("repeating_inventory_" + currentID + "_itemmodifiers");
		});
		getAttrs(attrs_to_get, function(v) {
			var update = {};
			var final_init = parseInt(v["dexterity_mod"], 10);
			if(v["use_intelligent_initiative"] && v["use_intelligent_initiative"] != 0) {
				final_init = parseInt(v["intelligence_mod"], 10);
			}
			if(v["initmod"] && !isNaN(parseInt(v["initmod"], 10))) {
				final_init = final_init + parseInt(v["initmod"], 10);
			}
			if(v["init_tiebreaker"] && v["init_tiebreaker"] != 0) {
				final_init = final_init + (parseInt(v["dexterity"], 10)/100);
			}
			if(v["jack_of_all_trades"] && v["jack_of_all_trades"] != 0) {
				if(v["pb_type"] && v["pb_type"] === "die" && v["jack"]) {
					// final_init = final_init + Math.floor(parseInt(v["jack"].substring(1),10)/2);
					final_init = final_init + "+" + v["jack"];
				}
				else if(v["jack"] && !isNaN(parseInt(v["jack"], 10))) {
					final_init = final_init + parseInt(v["jack"], 10);
				}
			}
			_.each(idarray, function(currentID){
				if(v["repeating_inventory_" + currentID + "_equipped"] && v["repeating_inventory_" + currentID + "_equipped"] === "1" && v["repeating_inventory_" + currentID + "_itemmodifiers"] && v["repeating_inventory_" + currentID + "_itemmodifiers"].toLowerCase().indexOf("ability checks") > -1) {
					var mods = v["repeating_inventory_" + currentID + "_itemmodifiers"].toLowerCase().split(",");
					_.each(mods, function(mod) {
						if(mod.indexOf("ability checks") > -1) {
							if(mod.indexOf("-") > -1) {
								var new_mod = !isNaN(parseInt(mod.replace(/[^0-9]/g, ""), 10)) ? parseInt(mod.replace(/[^0-9]/g, ""), 10) : false;
								final_init = new_mod ? final_init - new_mod : final_init;
							}
							else {
								var new_mod = !isNaN(parseInt(mod.replace(/[^0-9]/g, ""), 10)) ? parseInt(mod.replace(/[^0-9]/g, ""), 10) : false;
								final_init = new_mod ? final_init + new_mod : final_init;
							}
						}
					});
				}
			});
			if(final_init % 1 != 0) {
				final_init = parseFloat(final_init.toPrecision(12)); // ROUNDING ERROR BUGFIX
			}
			update["initiative_bonus"] = final_init;
			setAttrs(update, {silent: true});
		});
	});
};

var update_class = function() {
	getAttrs(["class","base_level","custom_class","cust_classname","cust_hitdietype","cust_spellcasting_ability","cust_strength_save_prof","cust_dexterity_save_prof","cust_constitution_save_prof","cust_intelligence_save_prof","cust_wisdom_save_prof","cust_charisma_save_prof","strength_save_prof","dexterity_save_prof","constitution_save_prof","intelligence_save_prof","wisdom_save_prof","charisma_save_prof","subclass","multiclass1","multiclass1_subclass","multiclass2","multiclass2_subclass","multiclass3","multiclass3_subclass","npc"], function(v) {
		if(v.npc && v.npc == "1") {
			return;
		}
		if(v.custom_class && v.custom_class != "0") {
			setAttrs({
				hitdietype: v.cust_hitdietype,
				spellcasting_ability: v.cust_spellcasting_ability,
				strength_save_prof: v.cust_strength_save_prof,
				dexterity_save_prof: v.cust_dexterity_save_prof,
				constitution_save_prof: v.cust_constitution_save_prof,
				intelligence_save_prof: v.cust_intelligence_save_prof,
				wisdom_save_prof: v.cust_wisdom_save_prof,
				charisma_save_prof: v.cust_charisma_save_prof
			});
		}
		else {
			update = {};
			switch(v.class) {
				case "":
					update["hitdietype"] = 6;
					update["spellcasting_ability"] = "0*";
					update["strength_save_prof"] = 0;
					update["dexterity_save_prof"] = 0;
					update["constitution_save_prof"] = 0;
					update["intelligence_save_prof"] = 0;
					update["wisdom_save_prof"] = 0;
					update["charisma_save_prof"] = 0;
					break;
				case "Barbarian":
					update["hitdietype"] = 12;
					update["spellcasting_ability"] = "0*";
					update["strength_save_prof"] = "(@{pb})";
					update["dexterity_save_prof"] = 0;
					update["constitution_save_prof"] = "(@{pb})";
					update["intelligence_save_prof"] = 0;
					update["wisdom_save_prof"] = 0;
					update["charisma_save_prof"] = 0;
					break;
				case "Bard":
					update["hitdietype"] = 8;
					update["spellcasting_ability"] = "@{charisma_mod}+";
					update["strength_save_prof"] = 0;
					update["dexterity_save_prof"] = "(@{pb})";
					update["constitution_save_prof"] = 0;
					update["intelligence_save_prof"] = 0;
					update["wisdom_save_prof"] = 0;
					update["charisma_save_prof"] = "(@{pb})";
					break;
				case "Cleric":
					update["hitdietype"] = 8;
					update["spellcasting_ability"] = "@{wisdom_mod}+";
					update["strength_save_prof"] = 0;
					update["dexterity_save_prof"] = 0;
					update["constitution_save_prof"] = 0;
					update["intelligence_save_prof"] = 0;
					update["wisdom_save_prof"] = "(@{pb})";
					update["charisma_save_prof"] = "(@{pb})";
					break;
				case "Druid":
					update["hitdietype"] = 8;
					update["spellcasting_ability"] = "@{wisdom_mod}+";
					update["strength_save_prof"] = 0;
					update["dexterity_save_prof"] = 0;
					update["constitution_save_prof"] = 0;
					update["intelligence_save_prof"] = "(@{pb})";
					update["wisdom_save_prof"] = "(@{pb})";
					update["charisma_save_prof"] = 0;
					break;
				case "Fighter":
					update["hitdietype"] = 10;
					update["spellcasting_ability"] = "0*";
					update["strength_save_prof"] = "(@{pb})";
					update["dexterity_save_prof"] = 0;
					update["constitution_save_prof"] = "(@{pb})";
					update["intelligence_save_prof"] = 0;
					update["wisdom_save_prof"] = 0;
					update["charisma_save_prof"] = 0;
					break;
				case "Monk":
					update["hitdietype"] = 8;
					update["spellcasting_ability"] = "0*";
					update["strength_save_prof"] = "(@{pb})";
					update["dexterity_save_prof"] = "(@{pb})";
					update["constitution_save_prof"] = 0;
					update["intelligence_save_prof"] = 0;
					update["wisdom_save_prof"] = 0;
					update["charisma_save_prof"] = 0;
					break;
				case "Paladin":
					update["hitdietype"] = 10;
					update["spellcasting_ability"] = "@{charisma_mod}+";
					update["strength_save_prof"] = 0;
					update["dexterity_save_prof"] = 0;
					update["constitution_save_prof"] = 0;
					update["intelligence_save_prof"] = 0;
					update["wisdom_save_prof"] = "(@{pb})";
					update["charisma_save_prof"] = "(@{pb})";
					break;
				case "Ranger":
					update["hitdietype"] = 10;
					update["spellcasting_ability"] = "@{wisdom_mod}+";
					update["strength_save_prof"] = "(@{pb})";
					update["dexterity_save_prof"] = "(@{pb})";
					update["constitution_save_prof"] = 0;
					update["intelligence_save_prof"] = 0;
					update["wisdom_save_prof"] = 0;
					update["charisma_save_prof"] = 0;
					break;
				case "Rogue":
					update["hitdietype"] = 8;
					update["spellcasting_ability"] = "0*";
					update["strength_save_prof"] = 0;
					update["dexterity_save_prof"] = "(@{pb})";
					update["constitution_save_prof"] = 0;
					update["intelligence_save_prof"] = "(@{pb})";
					update["wisdom_save_prof"] = 0;
					update["charisma_save_prof"] = 0;
					break;
				case "Sorcerer":
					update["hitdietype"] = 6;
					update["spellcasting_ability"] = "@{charisma_mod}+";
					update["strength_save_prof"] = 0;
					update["dexterity_save_prof"] = 0;
					update["constitution_save_prof"] = "(@{pb})";
					update["intelligence_save_prof"] = 0;
					update["wisdom_save_prof"] = 0;
					update["charisma_save_prof"] = "(@{pb})";
					break;
				case "Warlock":
					update["hitdietype"] = 8;
					update["spellcasting_ability"] = "@{charisma_mod}+";
					update["strength_save_prof"] = 0;
					update["dexterity_save_prof"] = 0;
					update["constitution_save_prof"] = 0;
					update["intelligence_save_prof"] = 0;
					update["wisdom_save_prof"] = "(@{pb})";
					update["charisma_save_prof"] = "(@{pb})";
					break;
				case "Wizard":
					update["hitdietype"] = 6;
					update["spellcasting_ability"] = "@{intelligence_mod}+";
					update["strength_save_prof"] = 0;
					update["dexterity_save_prof"] = 0;
					update["constitution_save_prof"] = 0;
					update["intelligence_save_prof"] = "(@{pb})";
					update["wisdom_save_prof"] = "(@{pb})";
					update["charisma_save_prof"] = 0;
					break;
			}
			setAttrs(update, {silent: true});
		};
	});
	set_level();
};

var set_level = function() {
	getAttrs(["base_level","multiclass1_flag","multiclass2_flag","multiclass3_flag","multiclass1_lvl","multiclass2_lvl","multiclass3_lvl","class","multiclass1","multiclass2","multiclass3", "arcane_fighter", "arcane_rogue", "custom_class", "cust_spellslots", "cust_classname", "level_calculations", "class", "subclass", "multiclass1_subclass","multiclass2_subclass","multiclass3_subclass"], function(v) {
		var update = {};
		var callbacks = [];
		var multiclass = (v.multiclass1_flag && v.multiclass1_flag === "1") || (v.multiclass2_flag && v.multiclass2_flag === "1") || (v.multiclass3_flag && v.multiclass3_flag === "1") ? true : false;
		var finalclass = v["custom_class"] && v["custom_class"] != "0" ? v["cust_spellslots"] : v["class"];
		var finallevel = (v.base_level && v.base_level > 0) ? parseInt(v.base_level,10) : 1;
		var charclass = v.custom_class && v.custom_class != "0" ? v["cust_classname"] : v["class"];
		var hitdie_final = multiclass ? "?{Hit Die Class|" + charclass + ",@{hitdietype}" : "@{hitdietype}";
		var subclass = v.subclass ? v.subclass + " " : "";
		var class_display = subclass + charclass + " " + finallevel;

		// This nested array is used to determine the overall spellcasting level for the character.
		var classes = [ [finalclass.toLowerCase(), v["base_level"]] ];

		if(v.multiclass1_flag && v.multiclass1_flag === "1") {
			var multiclasslevel = (v["multiclass1_lvl"] && v["multiclass1_lvl"] > 0) ? parseInt(v["multiclass1_lvl"], 10) : 1;
			finallevel = finallevel + multiclasslevel;
			hitdie_final = hitdie_final + "|" + v["multiclass1"].charAt(0).toUpperCase() + v["multiclass1"].slice(1) + "," + checkHitDie(v["multiclass1"]);
			classes.push([ v["multiclass1"], multiclasslevel ]);
			var subclass = v.multiclass1_subclass ? v.multiclass1_subclass + " " : "";
			class_display = class_display + ", " + subclass + v.multiclass1 + " " + multiclasslevel;
		};
		if(v.multiclass2_flag && v.multiclass2_flag === "1") {
			var multiclasslevel = (v["multiclass2_lvl"] && v["multiclass2_lvl"] > 0) ? parseInt(v["multiclass2_lvl"], 10) : 1;
			finallevel = finallevel + multiclasslevel;
			hitdie_final = hitdie_final + "|" + v["multiclass2"].charAt(0).toUpperCase() + v["multiclass2"].slice(1) + "," + checkHitDie(v["multiclass2"]);
			classes.push([ v["multiclass2"], multiclasslevel ]);
			var subclass = v.multiclass2_subclass ? v.multiclass2_subclass + " " : "";
			class_display = class_display + ", " + subclass + v.multiclass2 + " " + multiclasslevel;
		};
		if(v.multiclass3_flag && v.multiclass3_flag === "1") {
			var multiclasslevel = (v["multiclass3_lvl"] && v["multiclass3_lvl"] > 0) ? parseInt(v["multiclass3_lvl"], 10) : 1;
			finallevel = finallevel + multiclasslevel;
			hitdie_final = hitdie_final + "|" + v["multiclass3"].charAt(0).toUpperCase() + v["multiclass3"].slice(1) + "," + checkHitDie(v["multiclass3"]);
			classes.push([ v["multiclass3"], multiclasslevel ]);
			var subclass = v.multiclass3_subclass ? v.multiclass3_subclass + " " : "";
			class_display = class_display + ", " + subclass + v.multiclass3 + " " + multiclasslevel;
		};

		var casterlevel = checkCasterLevel(classes, v["arcane_fighter"], v["arcane_rogue"]);

		update["hitdie_final"] = multiclass ? hitdie_final + "}" : hitdie_final;
		update["level"] = finallevel;
		update["caster_level"] = casterlevel;
		update["class_display"] = class_display;

		if(!v["level_calculations"] || v["level_calculations"] == "on") {
			update["hit_dice_max"] = finallevel;
			callbacks.push( function() {update_spell_slots();} );
		}
		callbacks.push( function() {update_pb();} );
		callbacks.push( function() {update_leveler_display();} );
		setAttrs(update, {silent: true}, function() {callbacks.forEach(function(callback) {callback(); })} );
	});
};

var isMultiCaster = function(classes, arcane_fighter, arcane_rogue) {
	var singlecaster = false;
	var multicaster = false;
	_.each(classes, function(multiclass) {
		var caster = getCasterType(multiclass[0], multiclass[1], arcane_fighter, arcane_rogue) > 0;
		if(caster && singlecaster) {
			multicaster = true;
		} else if(caster) {
			singlecaster = true;
		}
	});
	return multicaster;
};

var getCasterType = function(class_string, levels, arcane_fighter, arcane_rogue) {
	var full = ["bard","cleric","druid","sorcerer","wizard","full"];
	var half = ["paladin","ranger","half"];
	class_string = class_string.toLowerCase();
	if(full.indexOf(class_string) != -1) {
		return 1;
	} else if(half.indexOf(class_string) != -1) {
		return (levels == 1) ? 0 : (1/2);
	} else if(class_string === "third" || (class_string === "fighter" && arcane_fighter === "1") || (class_string === "rogue" && arcane_rogue === "1")) {
		return (levels == 1 || levels == 2) ? 0 : (1/3);
	} else {
		return 0;
	}
};

var checkCasterLevel = function(classes, arcane_fighter, arcane_rogue) {
	console.log("CHECKING CASTER LEVEL");
	var multicaster = isMultiCaster(classes, arcane_fighter, arcane_rogue);
	var totalcasterlevel = 0;
	_.each(classes, function(multiclass) {
		var casterlevel = parseInt(multiclass[1], 10) * getCasterType(multiclass[0], multiclass[1], arcane_fighter, arcane_rogue);
		// Characters with multiple spellcasting classes round down the casting level for that class
		// Character with a single spellcasting class round up the casting level
		totalcasterlevel = totalcasterlevel + (multicaster ? Math.floor(casterlevel) : Math.ceil(casterlevel));
	});
	return totalcasterlevel;
};

var checkHitDie = function(class_string) {
	var d10class = ["fighter","paladin","ranger"];
	var d8class = ["bard","cleric","druid","monk","rogue","warlock"];
	var d6class = ["sorcerer","wizard"];
	class_string = class_string.toLowerCase();
	if(class_string === "barbarian") {return "12"}
	else if (d10class.indexOf(class_string) != -1) {return "10"}
	else if (d8class.indexOf(class_string) != -1) {return "8"}
	else if (d6class.indexOf(class_string) != -1) {return "6"}
	else {return "0"};
};

var update_leveler_display = function () {
	getAttrs(["experience","level"], function(v) {
		let lvl = 0;
		let exp = 0;
		let update = {};
		update["showleveler"] = 0;
		if(v["level"] && !isNaN(parseInt(v["level"], 10)) && parseInt(v["level"], 10) > 0) {
			lvl = parseInt(v["level"], 10);
		}
		if(v["experience"] && !isNaN(parseInt(v["experience"], 10)) && parseInt(v["experience"], 10) > 0) {
			exp = parseInt(v["experience"], 10);
		}
		if(lvl > 0 && exp > 0) {
			if((lvl === 1 && exp >= 300) || (lvl === 2 && exp >= 900) || (lvl === 3 && exp >= 2700) || (lvl === 4 && exp >= 6500) || (lvl === 5 && exp >= 14000) || (lvl === 6 && exp >= 23000) || (lvl === 7 && exp >= 34000) || (lvl === 8 && exp >= 48000) || (lvl === 9 && exp >= 64000) || (lvl === 10 && exp >= 85000) || (lvl === 11 && exp >= 100000) || (lvl === 12 && exp >= 120000) || (lvl === 13 && exp >= 140000) || (lvl === 14 && exp >= 165000) || (lvl === 15 && exp >= 195000) || (lvl === 16 && exp >= 225000) || (lvl === 17 && exp >= 265000) || (lvl === 18 && exp >= 305000) || (lvl === 19 && exp >= 355000)) {
				update["showleveler"] = 1;
			};
		};
		setAttrs(update, {silent: true});
	});
};

var update_spell_slots = function() {
	getAttrs(["lvl1_slots_mod","lvl2_slots_mod","lvl3_slots_mod","lvl4_slots_mod","lvl5_slots_mod","lvl6_slots_mod","lvl7_slots_mod","lvl8_slots_mod","lvl9_slots_mod","caster_level"], function(v) {
		var update = {};
		var lvl = v["caster_level"] && !isNaN(parseInt(v["caster_level"], 10)) ? parseInt(v["caster_level"], 10) : 0;
		var l1 = v["lvl1_slots_mod"] && !isNaN(parseInt(v["lvl1_slots_mod"], 10)) ? parseInt(v["lvl1_slots_mod"], 10) : 0;
		var l2 = v["lvl2_slots_mod"] && !isNaN(parseInt(v["lvl2_slots_mod"], 10)) ? parseInt(v["lvl2_slots_mod"], 10) : 0;
		var l3 = v["lvl3_slots_mod"] && !isNaN(parseInt(v["lvl3_slots_mod"], 10)) ? parseInt(v["lvl3_slots_mod"], 10) : 0;
		var l4 = v["lvl4_slots_mod"] && !isNaN(parseInt(v["lvl4_slots_mod"], 10)) ? parseInt(v["lvl4_slots_mod"], 10) : 0;
		var l5 = v["lvl5_slots_mod"] && !isNaN(parseInt(v["lvl5_slots_mod"], 10)) ? parseInt(v["lvl5_slots_mod"], 10) : 0;
		var l6 = v["lvl6_slots_mod"] && !isNaN(parseInt(v["lvl6_slots_mod"], 10)) ? parseInt(v["lvl6_slots_mod"], 10) : 0;
		var l7 = v["lvl7_slots_mod"] && !isNaN(parseInt(v["lvl7_slots_mod"], 10)) ? parseInt(v["lvl7_slots_mod"], 10) : 0;
		var l8 = v["lvl8_slots_mod"] && !isNaN(parseInt(v["lvl8_slots_mod"], 10)) ? parseInt(v["lvl8_slots_mod"], 10) : 0;
		var l9 = v["lvl9_slots_mod"] && !isNaN(parseInt(v["lvl9_slots_mod"], 10)) ? parseInt(v["lvl9_slots_mod"], 10) : 0;
		if(lvl > 0) {
			l1 = l1 + Math.min((lvl + 1),4);
			if(lvl < 3) {l2 = l2 + 0;} else if(lvl === 3) {l2 = l2 + 2;} else {l2 = l2 + 3;};
			if(lvl < 5) {l3 = l3 + 0;} else if(lvl === 5) {l3 = l3 + 2;} else {l3 = l3 + 3;};
			if(lvl < 7) {l4 = l4 + 0;} else if(lvl === 7) {l4 = l4 + 1;} else if(lvl === 8) {l4 = l4 + 2;} else {l4 = l4 + 3;};
			if(lvl < 9) {l5 = l5 + 0;} else if(lvl === 9) {l5 = l5 + 1;} else if(lvl < 18) {l5 = l5 + 2;} else {l5 = l5 + 3;};
			if(lvl < 11) {l6 = l6 + 0;} else if(lvl < 19) {l6 = l6 + 1;} else {l6 = l6 + 2;};
			if(lvl < 13) {l7 = l7 + 0;} else if(lvl < 20) {l7 = l7 + 1;} else {l7 = l7 + 2;};
			if(lvl < 15) {l8 = l8 + 0;} else {l8 = l8 + 1;};
			if(lvl < 17) {l9 = l9 + 0;} else {l9 = l9 + 1;};
		};

		update["lvl1_slots_total"] = l1;
		update["lvl2_slots_total"] = l2;
		update["lvl3_slots_total"] = l3;
		update["lvl4_slots_total"] = l4;
		update["lvl5_slots_total"] = l5;
		update["lvl6_slots_total"] = l6;
		update["lvl7_slots_total"] = l7;
		update["lvl8_slots_total"] = l8;
		update["lvl9_slots_total"] = l9;
		setAttrs(update, {silent: true});
	});
};

var update_pb = function() {
	callbacks = [];
	getAttrs(["level","pb_type","pb_custom"], function(v) {
		var update = {};
		var pb = 2;
		var lvl = parseInt(v["level"],10);
		if(lvl < 5) {pb = "2"} else if(lvl < 9) {pb = "3"} else if(lvl < 13) {pb = "4"} else if(lvl < 17) {pb = "5"} else {pb = "6"}
		var jack = Math.floor(pb/2);
		if(v["pb_type"] === "die") {
			update["jack"] = "d" + pb;
			update["pb"] = "d" + pb*2;
			update["pbd_safe"] = "cs0cf0";
		}
		else if(v["pb_type"] === "custom" && v["pb_custom"] && v["pb_custom"] != "") {
			update["pb"] = v["pb_custom"]
			update["jack"] = !isNaN(parseInt(v["pb_custom"],10)) ? Math.floor(parseInt(v["pb_custom"],10)/2) : jack;
			update["pbd_safe"] = "";
		}
		else {
			update["pb"] = pb;
			update["jack"] = jack;
			update["pbd_safe"] = "";
		};
		callbacks.push( function() {update_attacks("all");} );
		callbacks.push( function() {update_spell_info();} );
		callbacks.push( function() {update_jack_attr();} );
		callbacks.push( function() {update_initiative();} );
		callbacks.push( function() {update_tool("all");} );
		callbacks.push( function() {update_all_saves();} );
		callbacks.push( function() {update_skills(["athletics", "acrobatics", "sleight_of_hand", "stealth", "arcana", "history", "investigation", "nature", "religion", "animal_handling", "insight", "medicine", "perception", "survival","deception", "intimidation", "performance", "persuasion"]);} );

		setAttrs(update, {silent: true}, function() {callbacks.forEach(function(callback) {callback(); })} );
	});
};

var update_jack_attr = function() {
	var update = {};
	getAttrs(["jack_of_all_trades","jack"], function(v) {
		if(v["jack_of_all_trades"] && v["jack_of_all_trades"] != 0) {
			update["jack_bonus"] = "+" + v["jack"];
			update["jack_attr"] = "+" + v["jack"] + "@{pbd_safe}";
		}
		else {
			update["jack_bonus"] = "";
			update["jack_attr"] = "";
		}
		setAttrs(update, {silent: true});
	});
};

var update_spell_info = function(attr) {
	var update = {};
	getAttrs(["spellcasting_ability","spell_dc_mod","globalmagicmod","strength_mod","dexterity_mod","constitution_mod","intelligence_mod","wisdom_mod","charisma_mod"], function(v) {
		if(attr && v["spellcasting_ability"] && v["spellcasting_ability"].indexOf(attr) === -1) {
			return
		};
		if(!v["spellcasting_ability"] || (v["spellcasting_ability"] && v["spellcasting_ability"] === "0*")) {
			update["spell_attack_bonus"] = "0";
			update["spell_save_dc"] = "0";
			var callback = function() {update_attacks("spells")};
			setAttrs(update, {silent: true}, callback);
			return
		};
		var attr = attr ? attr : "";
		console.log("UPDATING SPELL INFO: " + attr);

		var ability = parseInt(v[v["spellcasting_ability"].substring(2,v["spellcasting_ability"].length-2)],10);
		var spell_mod = v["globalmagicmod"] && !isNaN(parseInt(v["globalmagicmod"], 10)) ? parseInt(v["globalmagicmod"], 10) : 0;
		var atk = v["globalmagicmod"] && !isNaN(parseInt(v["globalmagicmod"], 10)) ? ability + parseInt(v["globalmagicmod"], 10) : ability;
		var dc = v["spell_dc_mod"] && !isNaN(parseInt(v["spell_dc_mod"], 10)) ? 8 + ability + parseInt(v["spell_dc_mod"], 10) : 8 + ability;
		var itemfields = ["pb_type","pb"];

		getSectionIDs("repeating_inventory", function(idarray) {
			_.each(idarray, function(currentID, i) {
				itemfields.push("repeating_inventory_" + currentID + "_equipped");
				itemfields.push("repeating_inventory_" + currentID + "_itemmodifiers");
			});
			getAttrs(itemfields, function(v) {
				_.each(idarray, function(currentID) {
					if((!v["repeating_inventory_" + currentID + "_equipped"] || v["repeating_inventory_" + currentID + "_equipped"] === "1") && v["repeating_inventory_" + currentID + "_itemmodifiers"] && v["repeating_inventory_" + currentID + "_itemmodifiers"].toLowerCase().indexOf("spell" > -1)) {
						var mods = v["repeating_inventory_" + currentID + "_itemmodifiers"].toLowerCase().split(",");
						_.each(mods, function(mod) {
							if(mod.indexOf("spell attack") > -1) {
								var substr = mod.slice(mod.lastIndexOf("spell attack") + "spell attack".length);
								atk = substr && substr.length > 0 && !isNaN(parseInt(substr,10)) ? atk + parseInt(substr,10) : atk;
								spell_mod = substr && substr.length > 0 && !isNaN(parseInt(substr,10)) ? spell_mod + parseInt(substr,10) : spell_mod;
							};
							if(mod.indexOf("spell dc") > -1) {
								var substr = mod.slice(mod.lastIndexOf("spell dc") + "spell dc".length);
								dc = substr && substr.length > 0 && !isNaN(parseInt(substr,10)) ? dc + parseInt(substr,10) : dc;
							};
						});
					};
				});

				if(v["pb_type"] && v["pb_type"] === "die") {
					atk = atk + "+" + v["pb"];
					dc = dc + parseInt(v["pb"].substring(1), 10) / 2;
				}
				else {
					atk = parseInt(atk, 10) + parseInt(v["pb"], 10);
					dc = parseInt(dc, 10) + parseInt(v["pb"], 10);
				};
				update["spell_attack_mod"] = spell_mod;
				update["spell_attack_bonus"] = atk;
				update["spell_save_dc"] = dc;
				var callback = function() {update_attacks("spells")};
				setAttrs(update, {silent: true}, callback);
			});
		});
	});
};

var update_passive_perception = function() {
	getAttrs(["pb_type","passiveperceptionmod","perception_bonus"], function(v) {
		var passive_perception = 10;
		var mod = !isNaN(parseInt(v["passiveperceptionmod"],10)) ? parseInt(v["passiveperceptionmod"],10) : 0;
		var bonus = !isNaN(parseInt(v["perception_bonus"],10)) ? parseInt(v["perception_bonus"],10) : 0;
		if(v["pb_type"] && v["pb_type"] === "die" && v["perception_bonus"] && isNaN(v["perception_bonus"]) && v["perception_bonus"].indexOf("+") > -1) {
			var pieces = v["perception_bonus"].split(/\+|d/);
			var base = !isNaN(parseInt(pieces[0],10)) ? parseInt(pieces[0],10) : 0;
			var num_dice = !isNaN(parseInt(pieces[1],10)) ? parseInt(pieces[1],10) : 1;
			var half_pb_die = !isNaN(parseInt(pieces[2],10)) ? parseInt(pieces[2],10)/2 : 2;
			bonus = base + (num_dice * half_pb_die);
		}
		passive_perception = passive_perception + bonus + mod;
		setAttrs({passive_wisdom: passive_perception})
	});
};

var update_race_display = function() {
	getAttrs(["race", "subrace"], function(v) {
		var final_race = "";
		final_race = v.subrace ? v.subrace : v.race;
		if(v.race.toLowerCase() === "dragonborn") { final_race = v.race; };
		setAttrs({race_display: final_race});
	});
};

var organize_section_proficiencies = function() {
	getSectionIDs("proficiencies", function(ids) {
		var attribs = ["_reporder_repeating_proficiencies"];
		_.each(ids, function(id) {
			attribs.push("repeating_proficiencies_" + id + "_prof_type");
			attribs.push("repeating_proficiencies_" + id + "_name");
		});

		getAttrs(attribs, function(v) {
			var final_array = _(ids).chain().sortBy(function(id) {
				return v["repeating_proficiencies_" + id + "_name"];
			}).sortBy(function(id) {
				return v["repeating_proficiencies_" + id + "_prof_type"];
			}).value();
			_.each(final_array, function(id) {
			});
			if(final_array && final_array.length > 0) {
				setSectionOrder("proficiencies", final_array);
			};
		});
	});
};

var update_challenge = function() {
	getAttrs(["npc_challenge"], function(v) {
		var update = {};
		var xp = 0;
		var pb = 0;
		switch(v.npc_challenge.toString()) {
			case "0":
				xp = "10";
				pb = 2;
				break;
			case "1/8":
				xp = "25";
				pb = 2;
				break;
			case "1/4":
				xp = "50";
				pb = 2;
				break;
			case "1/2":
				xp = "100";
				pb = 2;
				break;
			case "1":
				xp = "200";
				pb = 2;
				break;
			case "2":
				xp = "450";
				pb = 2;
				break;
			case "3":
				xp = "700";
				pb = 2;
				break;
			case "4":
				xp = "1100";
				pb = 2;
				break;
			case "5":
				xp = "1800";
				pb = 3;
				break;
			case "6":
				xp = "2300";
				pb = 3;
				break;
			case "7":
				xp = "2900";
				pb = 3;
				break;
			case "8":
				xp = "3900";
				pb = 3;
				break;
			case "9":
				xp = "5000";
				pb = 4;
				break;
			case "10":
				xp = "5900";
				pb = 4;
				break;
			case "11":
				xp = "7200";
				pb = 4;
				break;
			case "12":
				xp = "8400";
				pb = 4;
				break;
			case "13":
				xp = "10000";
				pb = 5;
				break;
			case "14":
				xp = "11500";
				pb = 5;
				break;
			case "15":
				xp = "13000";
				pb = 5;
				break;
			case "16":
				xp = "15000";
				pb = 5;
				break;
			case "17":
				xp = "18000";
				pb = 6;
				break;
			case "18":
				xp = "20000";
				pb = 6;
				break;
			case "19":
				xp = "22000";
				pb = 6;
				break;
			case "20":
				xp = "25000";
				pb = 6;
				break;
			case "21":
				xp = "33000";
				pb = 7;
				break;
			case "22":
				xp = "41000";
				pb = 7;
				break;
			case "23":
				xp = "50000";
				pb = 7;
				break;
			case "24":
				xp = "62000";
				pb = 7;
				break;
			case "25":
				xp = "75000";
				pb = 8;
				break;
			case "26":
				xp = "90000";
				pb = 8;
				break;
			case "27":
				xp = "105000";
				pb = 8;
				break;
			case "28":
				xp = "120000";
				pb = 8;
				break;
			case "29":
				xp = "";
				pb = 9;
				break;
			case "30":
				xp = "155000";
				pb = 9;
				break;
		}
		update["npc_xp"] = xp;
		update["pb_custom"] = pb;
		update["pb_type"] = "custom";
		setAttrs(update, {silent: true}, function() {update_pb()});
	});
};

var update_npc_saves = function() {
	getAttrs(["npc_str_save_base","npc_dex_save_base","npc_con_save_base","npc_int_save_base","npc_wis_save_base","npc_cha_save_base"], function(v) {
		var update = {};
		var last_save = 0; var cha_save_flag = 0; var cha_save = ""; var wis_save_flag = 0; var wis_save = ""; var int_save_flag = 0; var int_save = ""; var con_save_flag = 0; var con_save = ""; var dex_save_flag = 0; var dex_save = ""; var str_save_flag = 0; var str_save = "";
		// 1 = Positive, 2 = Last, 3 = Negative, 4 = Last Negative
		if(v.npc_cha_save_base && v.npc_cha_save_base != "@{charisma_mod}") {cha_save = parseInt(v.npc_cha_save_base, 10); if(last_save === 0) {last_save = 1; cha_save_flag = cha_save < 0 ? 4 : 2;} else {cha_save_flag = cha_save < 0 ? 3 : 1;} } else {cha_save_flag = 0; cha_save = "";};
		if(v.npc_wis_save_base && v.npc_wis_save_base != "@{wisdom_mod}") {wis_save = parseInt(v.npc_wis_save_base, 10); if(last_save === 0) {last_save = 1; wis_save_flag = wis_save < 0 ? 4 : 2;} else {wis_save_flag = wis_save < 0 ? 3 : 1;} } else {wis_save_flag = 0; wis_save = "";};
		if(v.npc_int_save_base && v.npc_int_save_base != "@{intelligence_mod}") {int_save = parseInt(v.npc_int_save_base, 10); if(last_save === 0) {last_save = 1; int_save_flag = int_save < 0 ? 4 : 2;} else {int_save_flag = int_save < 0 ? 3 : 1;} } else {int_save_flag = 0; int_save = "";};
		if(v.npc_con_save_base && v.npc_con_save_base != "@{constitution_mod}") {con_save = parseInt(v.npc_con_save_base, 10); if(last_save === 0) {last_save = 1; con_save_flag = con_save < 0 ? 4 : 2;} else {con_save_flag = con_save < 0 ? 3 : 1;} } else {con_save_flag = 0; con_save = "";};
		if(v.npc_dex_save_base && v.npc_dex_save_base != "@{dexterity_mod}") {dex_save = parseInt(v.npc_dex_save_base, 10); if(last_save === 0) {last_save = 1; dex_save_flag = dex_save < 0 ? 4 : 2;} else {dex_save_flag = dex_save < 0 ? 3 : 1;} } else {dex_save_flag = 0; dex_save = "";};
		if(v.npc_str_save_base && v.npc_str_save_base != "@{strength_mod}") {str_save = parseInt(v.npc_str_save_base, 10); if(last_save === 0) {last_save = 1; str_save_flag = str_save < 0 ? 4 : 2;} else {str_save_flag = str_save < 0 ? 3 : 1;} } else {str_save_flag = 0; str_save = "";};

		update["npc_saving_flag"] = "" + cha_save + wis_save + int_save + con_save + dex_save + str_save;
		update["npc_str_save"] = str_save;
		update["npc_str_save_flag"] = str_save_flag;
		update["npc_dex_save"] = dex_save;
		update["npc_dex_save_flag"] = dex_save_flag;
		update["npc_con_save"] = con_save;
		update["npc_con_save_flag"] = con_save_flag;
		update["npc_int_save"] = int_save;
		update["npc_int_save_flag"] = int_save_flag;
		update["npc_wis_save"] = wis_save;
		update["npc_wis_save_flag"] = wis_save_flag;
		update["npc_cha_save"] = cha_save;
		update["npc_cha_save_flag"] = cha_save_flag;
		setAttrs(update, {silent: true});
	});
};

var update_npc_skills = function() {
	getAttrs(["npc_acrobatics_base","npc_animal_handling_base","npc_arcana_base","npc_athletics_base","npc_deception_base","npc_history_base","npc_insight_base","npc_intimidation_base","npc_investigation_base","npc_medicine_base","npc_nature_base","npc_perception_base","npc_performance_base","npc_persuasion_base","npc_religion_base","npc_sleight_of_hand_base","npc_stealth_base","npc_survival_base"], function(v) {
		var update = {};
		var last_skill = 0;
		var survival_flag = 0; var survival = ""; var stealth_flag = 0; var stealth = ""; var sleight_of_hand_flag = 0; var sleight_of_hand = ""; var religion_flag = 0; var religion = ""; var persuasion_flag = 0; var persuasion = ""; var performance_flag = 0; var sperformance = ""; var perception_flag = 0; var perception = ""; var perception_flag = 0; var perception = ""; var nature_flag = 0; var nature = ""; var medicine_flag = 0; var medicine = ""; var investigation_flag = 0; var investigation = ""; var intimidation_flag = 0; var intimidation = ""; var insight_flag = 0; var insight = ""; var history_flag = 0; var history = ""; var deception_flag = 0; var deception = ""; var athletics_flag = 0; var athletics = ""; var arcana_flag = 0; var arcana = ""; var animal_handling_flag = 0; var animal_handling = ""; var acrobatics_flag = 0; var acrobatics = "";

		// 1 = Positive, 2 = Last, 3 = Negative, 4 = Last Negative
		if(v.npc_survival_base && v.npc_survival_base != "@{wisdom_mod}") {survival = parseInt(v.npc_survival_base, 10); if(last_skill === 0) {last_skill = 1; survival_flag = survival < 0 ? 4 : 2;} else {survival_flag = survival < 0 ? 3 : 1;} } else {survival_flag = 0; survival = "";};
		if(v.npc_stealth_base && v.npc_stealth_base != "@{dexterity_mod}") {stealth = parseInt(v.npc_stealth_base, 10); if(last_skill === 0) {last_skill = 1; stealth_flag = stealth < 0 ? 4 : 2;} else {stealth_flag = stealth < 0 ? 3 : 1;} } else {stealth_flag = 0; stealth = "";};
		if(v.npc_sleight_of_hand_base && v.npc_sleight_of_hand_base != "@{dexterity_mod}") {sleight_of_hand = parseInt(v.npc_sleight_of_hand_base, 10); if(last_skill === 0) {last_skill = 1; sleight_of_hand_flag = sleight_of_hand < 0 ? 4 : 2;} else {sleight_of_hand_flag = sleight_of_hand < 0 ? 3 : 1;} } else {sleight_of_hand_flag = 0; sleight_of_hand = "";};
		if(v.npc_religion_base && v.npc_religion_base != "@{intelligence_mod}") {religion = parseInt(v.npc_religion_base, 10); if(last_skill === 0) {last_skill = 1; religion_flag = religion < 0 ? 4 : 2;} else {religion_flag = religion < 0 ? 3 : 1;} } else {religion_flag = 0; religion = "";};
		if(v.npc_persuasion_base && v.npc_persuasion_base != "@{charisma_mod}") {persuasion = parseInt(v.npc_persuasion_base, 10); if(last_skill === 0) {last_skill = 1; persuasion_flag = persuasion < 0 ? 4 : 2;} else {persuasion_flag = persuasion < 0 ? 3 : 1;} } else {persuasion_flag = 0; persuasion = "";};
		if(v.npc_performance_base && v.npc_performance_base != "@{charisma_mod}") {sperformance = parseInt(v.npc_performance_base, 10); if(last_skill === 0) {last_skill = 1; performance_flag = sperformance < 0 ? 4 : 2;} else {performance_flag = sperformance < 0 ? 3 : 1;} } else {performance_flag = 0; sperformance = "";};
		if(v.npc_perception_base && v.npc_perception_base != "@{wisdom_mod}") {perception = parseInt(v.npc_perception_base, 10); if(last_skill === 0) {last_skill = 1; perception_flag = perception < 0 ? 4 : 2;} else {perception_flag = perception < 0 ? 3 : 1;} } else {perception_flag = 0; perception = "";};
		if(v.npc_nature_base && v.npc_nature_base != "@{intelligence_mod}") {nature = parseInt(v.npc_nature_base, 10); if(last_skill === 0) {last_skill = 1; nature_flag = nature < 0 ? 4 : 2;} else {nature_flag = nature < 0 ? 3 : 1;} } else {nature_flag = 0; nature = "";};
		if(v.npc_medicine_base && v.npc_medicine_base != "@{wisdom_mod}") {medicine = parseInt(v.npc_medicine_base, 10); if(last_skill === 0) {last_skill = 1; medicine_flag = medicine < 0 ? 4 : 2;} else {medicine_flag = medicine < 0 ? 3 : 1;} } else {medicine_flag = 0; medicine = "";};
		if(v.npc_investigation_base && v.npc_investigation_base != "@{intelligence_mod}") {investigation = parseInt(v.npc_investigation_base, 10); if(last_skill === 0) {last_skill = 1; investigation_flag = investigation < 0 ? 4 : 2;} else {investigation_flag = investigation < 0 ? 3 : 1;} } else {investigation_flag = 0; investigation = "";};
		if(v.npc_intimidation_base && v.npc_intimidation_base != "@{charisma_mod}") {intimidation = parseInt(v.npc_intimidation_base, 10); if(last_skill === 0) {last_skill = 1; intimidation_flag = intimidation < 0 ? 4 : 2;} else {intimidation_flag = intimidation < 0 ? 3 : 1;} } else {intimidation_flag = 0; intimidation = "";};
		if(v.npc_insight_base && v.npc_insight_base != "@{wisdom_mod}") {insight = parseInt(v.npc_insight_base, 10); if(last_skill === 0) {last_skill = 1; insight_flag = insight < 0 ? 4 : 2;} else {insight_flag = insight < 0 ? 3 : 1;} } else {insight_flag = 0; insight = "";};
		if(v.npc_history_base && v.npc_history_base != "@{intelligence_mod}") {history = parseInt(v.npc_history_base, 10); if(last_skill === 0) {last_skill = 1; history_flag = history < 0 ? 4 : 2;} else {history_flag = history < 0 ? 3 : 1;} } else {history_flag = 0; history = "";};
		if(v.npc_deception_base && v.npc_deception_base != "@{charisma_mod}") {deception = parseInt(v.npc_deception_base, 10); if(last_skill === 0) {last_skill = 1; deception_flag = deception < 0 ? 4 : 2;} else {deception_flag = deception < 0 ? 3 : 1;} } else {deception_flag = 0; deception = "";};
		if(v.npc_athletics_base && v.npc_athletics_base != "@{strength_mod}") {athletics = parseInt(v.npc_athletics_base, 10); if(last_skill === 0) {last_skill = 1; athletics_flag = athletics < 0 ? 4 : 2;} else {athletics_flag = athletics < 0 ? 3 : 1;} } else {athletics_flag = 0; athletics = "";};
		if(v.npc_arcana_base && v.npc_arcana_base != "@{intelligence_mod}") {arcana = parseInt(v.npc_arcana_base, 10); if(last_skill === 0) {last_skill = 1; arcana_flag = arcana < 0 ? 4 : 2;} else {arcana_flag = arcana < 0 ? 3 : 1;} } else {arcana_flag = 0; arcana = "";};
		if(v.npc_animal_handling_base && v.npc_animal_handling_base != "@{wisdom_mod}") {animal_handling = parseInt(v.npc_animal_handling_base, 10); if(last_skill === 0) {last_skill = 1; animal_handling_flag = animal_handling < 0 ? 4 : 2;} else {animal_handling_flag = animal_handling < 0 ? 3 : 1;} } else {animal_handling_flag = 0; animal_handling = "";};
		if(v.npc_acrobatics_base && v.npc_acrobatics_base != "@{dexterity_mod}") {acrobatics = parseInt(v.npc_acrobatics_base, 10); if(last_skill === 0) {last_skill = 1; acrobatics_flag = acrobatics < 0 ? 4 : 2;} else {acrobatics_flag = acrobatics < 0 ? 3 : 1;} } else {acrobatics_flag = 0; acrobatics = "";};

		update["npc_skills_flag"] = "" + acrobatics + animal_handling + arcana + athletics + deception + history + insight + intimidation + investigation + medicine + nature + perception + sperformance + persuasion + religion + sleight_of_hand + stealth + survival;
		update["npc_stealth_flag"] = stealth_flag;
		update["npc_survival"] = survival;;
		update["npc_acrobatics"] = acrobatics;
		update["npc_acrobatics_flag"] = acrobatics_flag;
		update["npc_animal_handling"] = animal_handling;
		update["npc_animal_handling_flag"] = animal_handling_flag;
		update["npc_arcana"] = arcana;
		update["npc_arcana_flag"] = arcana_flag;
		update["npc_athletics"] = athletics;
		update["npc_athletics_flag"] = athletics_flag;
		update["npc_deception"] = deception;
		update["npc_deception_flag"] = deception_flag;
		update["npc_history"] = history;
		update["npc_history_flag"] = history_flag;
		update["npc_insight"] = insight;
		update["npc_insight_flag"] = insight_flag;
		update["npc_intimidation"] = intimidation;
		update["npc_intimidation_flag"] = intimidation_flag;
		update["npc_investigation"] = investigation;
		update["npc_investigation_flag"] = investigation_flag;
		update["npc_medicine"] = medicine;
		update["npc_medicine_flag"] = medicine_flag;
		update["npc_nature"] = nature;
		update["npc_nature_flag"] = nature_flag;
		update["npc_perception"] = perception;
		update["npc_perception_flag"] = perception_flag;
		update["npc_performance"] = sperformance;
		update["npc_performance_flag"] = performance_flag;
		update["npc_persuasion"] = persuasion;
		update["npc_persuasion_flag"] = persuasion_flag;
		update["npc_religion"] = religion;
		update["npc_religion_flag"] = religion_flag;
		update["npc_sleight_of_hand"] = sleight_of_hand;
		update["npc_sleight_of_hand_flag"] = sleight_of_hand_flag;
		update["npc_stealth"] = stealth;
		update["npc_stealth_flag"] = stealth_flag;
		update["npc_survival"] = survival;
		update["npc_survival_flag"] = survival_flag;
		setAttrs(update, {silent: true});
	});
};

var update_npc_action = function(update_id, legendary) {
	if(update_id.substring(0,1) === "-" && update_id.length === 20) {
		do_update_npc_action([update_id], legendary);
	}
	else if(update_id === "all") {
		var legendary_array = [];
		var actions_array = [];
		getSectionIDs("repeating_npcaction-l", function(idarray) {
			legendary_array = idarray;
			if(legendary_array.length > 0) {
				do_update_npc_action(legendary_array, true);
			}
			getSectionIDs("repeating_npcaction", function(idarray) {
				actions_array = idarray.filter(function(i) {return legendary_array.indexOf(i) < 0;});
				if(actions_array.length > 0) {
					do_update_npc_action(actions_array, false);
				};
			});
		});
	};
};

var do_update_npc_action = function(action_array, legendary) {
	var repvar = legendary ? "repeating_npcaction-l_" : "repeating_npcaction_";
	var action_attribs = ["dtype"];
	_.each(action_array, function(actionid) {
		action_attribs.push(repvar + actionid + "_attack_flag");
		action_attribs.push(repvar + actionid + "_attack_type");
		action_attribs.push(repvar + actionid + "_attack_range");
		action_attribs.push(repvar + actionid + "_attack_target");
		action_attribs.push(repvar + actionid + "_attack_tohit");
		action_attribs.push(repvar + actionid + "_attack_damage");
		action_attribs.push(repvar + actionid + "_attack_damagetype");
		action_attribs.push(repvar + actionid + "_attack_damage2");
		action_attribs.push(repvar + actionid + "_attack_damagetype2");
	});

	getAttrs(action_attribs, function(v) {
		_.each(action_array, function(actionid) {
			console.log("UPDATING NPC ACTION: " + actionid);
			var callbacks = [];
			var update = {};
			var onhit = "";
			var damage_flag = "";
			var range = "";
			var attack_flag = v[repvar + actionid + "_attack_flag"] && v[repvar + actionid + "_attack_flag"] != "0" ? "{{attack=1}}" : "";
			var tohit = v[repvar + actionid + "_attack_tohit"] && isNaN(parseInt(v[repvar + actionid + "_attack_tohit"], 10)) === false ? parseInt(v[repvar + actionid + "_attack_tohit"], 10) : 0;
			if(v[repvar + actionid + "_attack_type"] && v[repvar + actionid + "_attack_range"]) {
				if(v[repvar + actionid + "_attack_type"] === "Melee") {var rangetype = "Reach";} else {var rangetype = "Range";};
				range = ", " + rangetype + " " + v[repvar + actionid + "_attack_range"];
			}
			var target = v[repvar + actionid + "_attack_target"] && v[repvar + actionid + "_attack_target"] != "" ? ", " + v[repvar + actionid + "_attack_target"] : ""
			var attack_tohitrange = "+" + tohit + range + target;
			var dmg1 = v[repvar + actionid + "_attack_damage"] && v[repvar + actionid + "_attack_damage"] != "" ? v[repvar + actionid + "_attack_damage"] : "";
			var dmg1type = v[repvar + actionid + "_attack_damagetype"] && v[repvar + actionid + "_attack_damagetype"] != "" ? " " + v[repvar + actionid + "_attack_damagetype"] : "";
			var dmg2 = v[repvar + actionid + "_attack_damage2"] && v[repvar + actionid + "_attack_damage2"] != "" ? v[repvar + actionid + "_attack_damage2"] : "";
			var dmg2type = v[repvar + actionid + "_attack_damagetype2"] && v[repvar + actionid + "_attack_damagetype2"] != "" ? " " + v[repvar + actionid + "_attack_damagetype2"] : "";
			var dmgspacer = dmg1 != "" && dmg2 != "" ? " plus " : "";

			var parsed_dmg1 = parse_roll_string(dmg1);
			var parsed_dmg2 = parse_roll_string(dmg2);

			if(dmg1 != "") {
				onhit = onhit + parsed_dmg1.avg + " (" + dmg1 + ")" + dmg1type + " damage";
			};
			dmgspacer = dmg1 != "" && dmg2 != "" ? " plus " : "";
			onhit = onhit + dmgspacer;
			if(dmg2 != "") {
				onhit = onhit + parsed_dmg2.avg + " (" + dmg2 + ")" + dmg2type + " damage";
			};
			if(dmg1 != "" || dmg2 != "") {damage_flag = damage_flag + "{{damage=1}} "};
			if(dmg1 != "") {damage_flag = damage_flag + "{{dmg1flag=1}} "};
			if(dmg2 != "") {damage_flag = damage_flag + "{{dmg2flag=1}} "};

			var crit1 = "";
			if(parsed_dmg1.rolls.length > 0){
				parsed_dmg1.rolls.forEach(function(value) {
					crit1 += parsed_dmg1.array[value] + "+";
				});
				crit1 = crit1.substring(0, crit1.length - 1);
			}

			var crit2 = "";
			if(parsed_dmg2.rolls.length > 0){
				parsed_dmg2.rolls.forEach(function(value) {
					crit2 += parsed_dmg2.array[value] + "+";
				});
				crit2 = crit2.substring(0, crit2.length - 1);
			}

			var rollbase = "";
			if(v.dtype === "full") {
				rollbase = "@{wtype}&{template:npcaction} " + attack_flag + " @{damage_flag} @{npc_name_flag} {{rname=@{name}}} {{r1=[[@{d20}+(@{attack_tohit}+0)]]}} @{rtype}+(@{attack_tohit}+0)]]}} {{dmg1=[[@{attack_damage}+0]]}} {{dmg1type=@{attack_damagetype}}} {{dmg2=[[@{attack_damage2}+0]]}} {{dmg2type=@{attack_damagetype2}}} {{crit1=[[@{attack_crit}+0]]}} {{crit2=[[@{attack_crit2}+0]]}} {{description=@{show_desc}}} @{charname_output}";
			}
			else if(v[repvar + actionid + "_attack_flag"] && v[repvar + actionid + "_attack_flag"] != "0") {
				if(legendary) {
					rollbase = "@{wtype}&{template:npcatk} " + attack_flag + " @{damage_flag} @{npc_name_flag} {{rname=[@{name}](~repeating_npcaction-l_npc_dmg)}} {{rnamec=[@{name}](~repeating_npcaction-l_npc_crit)}} {{type=[Attack](~repeating_npcaction-l_npc_dmg)}} {{typec=[Attack](~repeating_npcaction-l_npc_crit)}} {{r1=[[@{d20}+(@{attack_tohit}+0)]]}} @{rtype}+(@{attack_tohit}+0)]]}} {{description=@{show_desc}}} @{charname_output}"
				}
				else {
					rollbase = "@{wtype}&{template:npcatk} " + attack_flag + " @{damage_flag} @{npc_name_flag} {{rname=[@{name}](~repeating_npcaction_npc_dmg)}} {{rnamec=[@{name}](~repeating_npcaction_npc_crit)}} {{type=[Attack](~repeating_npcaction_npc_dmg)}} {{typec=[Attack](~repeating_npcaction_npc_crit)}} {{r1=[[@{d20}+(@{attack_tohit}+0)]]}} @{rtype}+(@{attack_tohit}+0)]]}} {{description=@{show_desc}}} @{charname_output}";
				}
			}
			else if(dmg1 || dmg2) {
				rollbase = "@{wtype}&{template:npcdmg} @{damage_flag} {{dmg1=[[@{attack_damage}+0]]}} {{dmg1type=@{attack_damagetype}}} {{dmg2=[[@{attack_damage2}+0]]}} {{dmg2type=@{attack_damagetype2}}} {{crit1=[[@{attack_crit}+0]]}} {{crit2=[[@{attack_crit2}+0]]}} @{charname_output}"
			}
			else {
				rollbase = "@{wtype}&{template:npcaction} @{npc_name_flag} {{rname=@{name}}} {{description=@{show_desc}}} @{charname_output}"
			}

			update[repvar + actionid + "_attack_tohitrange"] = attack_tohitrange;
			update[repvar + actionid + "_attack_onhit"] = onhit;
			update[repvar + actionid + "_damage_flag"] = damage_flag;
			update[repvar + actionid + "_attack_crit"] = crit1;
			update[repvar + actionid + "_attack_crit2"] = crit2;
			update[repvar + actionid + "_rollbase"] = rollbase;
			setAttrs(update, {silent: true});
		});
	});
};

var parse_roll_string = function(rollstring) {
	var out = {array: [], avg: 0, rolls: []};

	if(!rollstring || rollstring === "") {
		return out;
	}

	var rs_regex_initial = /(\-?\d+(?:d\d+)?)/ig;
	var rs_regex_repeating = /([\+\-])(\-?\d+(?:d\d+)?)/ig;
	var rs_nospace = rollstring.replace(/\s/g, '');
	var rs_initial = rs_regex_initial.exec(rs_nospace);

	if(rs_initial) {
		out.array.push(rs_initial[1]);
		rs_regex_repeating.lastIndex = rs_regex_initial.lastIndex;
		var rs_repeating;
		while(rs_repeating = rs_regex_repeating.exec(rs_nospace)) {
			out.array.push(rs_repeating[1], rs_repeating[2]);
		}
	}

	var add = true;
	var dice_regex = /(\d+)d(\d+)/i;
	var dice;

	out.array.forEach(function(value, index, array) {
		if(value === "+") {
			add = true;
		} else if(value === "-") {
			add = false;
		} else if(dice = dice_regex.exec(value)){
			// this value is a die roll
			var dice_avg = Math.floor(+dice[1] * (+dice[2] / 2 + 0.5));
			out.avg += add ? dice_avg : -dice_avg;
			out.rolls.push(index);
		} else {
			// this value is a number
			out.avg += add ? +value : -+value;
		}
	})

	return out;
};

var get_class_level = function(class_name, callback) {
	getAttrs(["class", "base_level", "multiclass1_flag", "multiclass1", "multiclass1_lvl", "multiclass2_flag", "multiclass2", "multiclass2_lvl", "multiclass3_flag", "multiclass3", "multiclass3_lvl"], function(attrs) {
		var regex = new RegExp(class_name, "i");
		if(regex.test(attrs["class"])) {
			callback(attrs.base_level);
		} else if(attrs.multiclass1_flag && attrs.multiclass1_flag !== "0" && regex.test(attrs.multiclass1)) {
			callback(attrs.multiclass1_lvl);
		} else if(attrs.multiclass2_flag && attrs.multiclass2_flag !== "0" && regex.test(attrs.multiclass2)) {
			callback(attrs.multiclass2_lvl);
		} else if(attrs.multiclass3_flag && attrs.multiclass3_flag !== "0" && regex.test(attrs.multiclass3)) {
			callback(attrs.multiclass3_lvl);
		} else {
			callback("0");
		}
	});
};

var update_globaldamage = function(callback) {
	getSectionIDs("damagemod", function(ids) {
		if(ids) {
			var fields = {};
			var attr_name_list = [];
			ids.forEach(function(id) {
				fields[id] = {};
				attr_name_list.push(`repeating_damagemod_${id}_global_damage_active_flag`, `repeating_damagemod_${id}_global_damage_name`, `repeating_damagemod_${id}_global_damage_damage`, `repeating_damagemod_${id}_global_damage_type`);
			});

			getAttrs(attr_name_list, function(attrs) {
				var regex = /^repeating_damagemod_(.+)_global_damage_(active_flag|name|damage|type)$/;
				_.each(attrs, function(obj, name) {
					var r = regex.exec(name);
					if(r) {
						fields[r[1]][r[2]] = obj;
					};
				});

				var update = {global_damage_mod_roll: "", global_damage_mod_crit: "", global_damage_mod_type: ""};

				console.log("GLOBALDAMAGE");
				_.each(fields, function(element) {
					if(element.active_flag != "0") {
						if(element.name && element.name !== "") { update["global_damage_mod_roll"] += element.damage + '[' + element.name + ']' + "+"; }
						if(element.type && element.type !== "") { update["global_damage_mod_type"] += element.type + "/"; }
					}
				});

				update["global_damage_mod_roll"] = update["global_damage_mod_roll"].replace(/\+(?=$)/, '');
				update["global_damage_mod_type"] = update["global_damage_mod_type"].replace(/\/(?=$)/, '');

				// Remove any non-roll damage modifiers from the global damage modifier for the crit rolls
				// Will also remove any labels attached to these non-roll damage modifiers
				update["global_damage_mod_crit"] = update["global_damage_mod_roll"].replace(/(?:[+\-*\/%]|\*\*|^)\s*\d+(?:\[.*?])?(?!d\d+)/gi, '')
					// If what was just replace removed the first damage modifier, remove any now precending plus signs
					.replace(/(?:^\+)/i, '');

				setAttrs(update, {silent:true}, function() {
					update_attacks("all");
					if(typeof callback == "function") callback();
				});
			});
		}
	});
};

var update_globalattack = function(callback) {
	getSectionIDs("tohitmod", function(ids) {
		if(ids) {
			var fields = {};
			var attr_name_list = [];
			ids.forEach(function(id) {
				fields[id] = {};
				attr_name_list.push(`repeating_tohitmod_${id}_global_attack_active_flag`, `repeating_tohitmod_${id}_global_attack_roll`, `repeating_tohitmod_${id}_global_attack_name`);
			});
			getAttrs(attr_name_list, function(attrs) {
				var regex = /^repeating_tohitmod_(.+)_global_attack_(active_flag|roll|name)$/;
				_.each(attrs, function(obj, name) {
					var r = regex.exec(name);
					if(r) {
						fields[r[1]][r[2]] = obj;
					}
				});

				var update = {global_attack_mod: ""};
				console.log("GLOBALATTACK");
				_.each(fields, function(element) {
					if(element.active_flag != "0") {
						if(element.roll && element.roll !== "") { update["global_attack_mod"] += element.roll + "[" + element.name + "]" + "+"; }
					}
				});
				if(update["global_attack_mod"] !== "") {
					update["global_attack_mod"] = "[[" + update["global_attack_mod"].replace(/\+(?=$)/, '') + "]]";
				}
				setAttrs(update, {silent:true}, function() {
					if(typeof callback == "function") callback();
				});
			});
		}
	});
};

var update_globalsaves = function(callback) {
	getSectionIDs("savemod", function(ids) {
		if(ids) {
			var fields = {};
			var attr_name_list = [];
			ids.forEach(function(id) {
				fields[id] = {};
				attr_name_list.push(`repeating_savemod_${id}_global_save_active_flag`, `repeating_savemod_${id}_global_save_roll`, `repeating_savemod_${id}_global_save_name`);
			});
			getAttrs(attr_name_list, function(attrs) {
				var regex = /^repeating_savemod_(.+)_global_save_(active_flag|roll|name)$/;
				_.each(attrs, function(obj, name) {
					var r = regex.exec(name);
					if(r) {
						fields[r[1]][r[2]] = obj;
					}
				});

				var update = {global_save_mod: ""};
				console.log("GLOBAL SAVES");
				_.each(fields, function(element) {
					if(element.active_flag != "0") {
						if(element.roll && element.roll !== "") { update["global_save_mod"] += element.roll + "[" + element.name + "]" + "+"; }
					}
				});
				if(update["global_save_mod"] !== "") {
					update["global_save_mod"] = "[[" + update["global_save_mod"].replace(/\+(?=$)/, '') + "]]";
				}
				setAttrs(update, {silent:true}, function() {
					if(typeof callback == "function") callback();
				});
			});
		}
	});
};

var update_globalskills = function(callback) {
	getSectionIDs("skillmod", function(ids) {
		if(ids) {
			var fields = {};
			var attr_name_list = [];
			ids.forEach(function(id) {
				fields[id] = {};
				attr_name_list.push(`repeating_skillmod_${id}_global_skill_active_flag`, `repeating_skillmod_${id}_global_skill_roll`, `repeating_skillmod_${id}_global_skill_name`);
			});
			getAttrs(attr_name_list, function(attrs) {
				var regex = /^repeating_skillmod_(.+)_global_skill_(active_flag|roll|name)$/;
				_.each(attrs, function(obj, name) {
					var r = regex.exec(name);
					if(r) {
						fields[r[1]][r[2]] = obj;
					}
				});

				var update = {global_skill_mod: ""};
				console.log("GLOBAL SKILLS");
				_.each(fields, function(element) {
					if(element.active_flag != "0") {
						if(element.roll && element.roll !== "") { update["global_skill_mod"] += element.roll + "[" + element.name + "]" + "+"; }
					}
				});
				if(update["global_skill_mod"] !== "") {
					update["global_skill_mod"] = "[[" + update["global_skill_mod"].replace(/\+(?=$)/, '') + "]]";
				}
				setAttrs(update, {silent:true}, function() {
					if(typeof callback == "function") callback();
				});
			});
		}
	});
};

var clear_npc_spell_attacks = function(complete) {
	getSectionIDs("repeating_attack", function(attack_ids) {
		var getList = [];
		var done = false;
		_.each(attack_ids, function(id) {
			getList.push(`repeating_attack_${id}_spellid`);
		});
		getAttrs(getList, function(v) {
			_.each(attack_ids, function(id) {
				if (v[`repeating_attack_${id}_spellid`] && v[`repeating_attack_${id}_spellid`].indexOf("npc_") != -1) {
					removeRepeatingRow(`repeating_attack_${id}`);
				}
			});
			complete();
		});
	});
}

var filterBlobs = function(blobs, filters) {
	var remove = filters.multiclass ? "no" : "yes";
	var results = {};
	delete filters.multiclass;
	delete filters.slide;
	_.each(blobs, function(blob, name) {
			var match = true;
			if(blob.Group && !filters.Group && !filters.name) match = false;
			_.each(filters, function(v, k) {
					if(k == "name") {
							if(name != v) match = false;
					} else if(v[0] === "<" && !isNaN(parseInt(v.substring(1)))) {
							let blobval = isNaN(parseInt(blob[k])) ? 0 : parseInt(blob[k]);
							if(blobval > parseInt(v.substring(1))) match = false;
					} else {
							if(blob[k] != v) match = false;
					}
			});
			if(match && name.split("(")[0].toLowerCase() != "spell slots") results[name] = blob;
	});
	_.each(results, function(blob, name) {
			if(blob.Multiclass == remove) {
					delete results[name];
			}
	});
	return results;
};

// CHANGE SURVIVAL CONDITIONS

on("change:condition_temperature change:condition_hunger change:condition_thirst change:condition_fatigue", function () {
	let field1 = "condition_temperature";
	let field2 = "condition_hunger";
	let field3 = "condition_thirst";
	let field4 = "condition_fatigue";
	let exhaustionMod = 0;

	getAttrs([field1, field2, field3, field4], function (v) {

		[field1, field2, field3, field4].forEach(function(field) {
			let value = toInt(v[field]);
			exhaustionMod += (value == 0 ? -1 : value >= 5 ? 1 : 0);
		});

		let update = {};
		update["exhaustion_conditions"] = exhaustionMod;
		setAttrs(update);
	});
});

// CHANGE EXHAUSTION

on("change:exhaustion_base change:exhaustion_wounds change:exhaustion_conditions change:show_survival_conditions", function () {
	let field1 = "exhaustion_base";
	let field2 = "exhaustion_wounds";
	let field3 = "exhaustion_conditions";
	let field4 = "show_survival_conditions";

	getAttrs([field1, field2, field3, field4], function (v) {
		let update = {};
		let exhaustionTotal = clamp(toInt(v[field1]) + toInt(v[field2]) + toInt(v[field3]), 0, 6);
		update["exhaustion_total"] = exhaustionTotal;
		if (toInt(v[field4]) == 1) {
			update["exhaustion_status"] = exhaustionTotal;
		}
		setAttrs(update);
	});
});


// CHANGE WOUND TREATMENT

on("change:repeating_wounds remove:repeating_wounds", function (eventinfo) {

	getSectionIDs('repeating_wounds', function (ids) {
		let fields = [];

		ids.forEach(function (id) {
			fields.push("repeating_wounds_" + id + "_wound_untreated");
		});

		getAttrs(fields, function (v) {

			let untreated_wounds = 0;

			ids.forEach(function (id) {
				let attribute = v["repeating_wounds_" + id + "_wound_untreated"];
				if (isDefined(attribute) && attribute == 1) {
					untreated_wounds += 1;
				}
			});

			let update = {};
			update["exhaustion_wounds"] = untreated_wounds;
			setAttrs(update);
		});
	});
});

// CHANGE STRESS

on("change:stress", function (eventinfo) {
	let stress = toInt(eventinfo.newValue);
	let update = {};
	if (stress >= 20) {
		update["stress_state_20"] = 1;
	}
	if (stress >= 30) {
		update["stress_state_30"] = 1;
	}
	if (stress >= 35) {
		update["stress_state_35"] = 1;
	}
	if (stress >= 40) {
		update["stress_state_40"] = 1;
	}
	setAttrs(update);
});

// CHANGE HIT POINTS

on("change:hit_dice change:hit_dice_max change:hp change:hp_max", function () {
	let field1 = "hp";
	let field2 = "hp_max";
	let field3 = "hit_dice_max";
	let field4 = "hit_dice";

	getAttrs([field1, field2, field3, field4], function (v) {
		let conditionHealth = "";
		let hp = toInt(v[field1]);
		let hpMax = toInt(v[field2]);
		let hpPercentage = clamp(hp / hpMax, 0, 1) || 0;
		let hitDiceTotal = toInt(v[field3]);
		let hitDiceSpent = clamp(hitDiceTotal - toInt(v[field4]), 0, hitDiceTotal);
		let hitDicePercentage = clamp((hitDiceTotal - hitDiceSpent) / hitDiceTotal, 0, 1) || 0;

		if (hp >= hpMax) {
			if (hitDicePercentage == 1) {
				conditionHealth = 0;
			} else if (hitDicePercentage >= 0.5) {
				conditionHealth = 1;
			} else {
				conditionHealth = 2;
			}
		} else {
			if (hpPercentage > 0.5) {
				conditionHealth = 3;
			} else if (hp == 1) {
				 conditionHealth = 6;
			} else if (hpPercentage >= 0.25) {
				conditionHealth = 4;
			} else if (hpPercentage >= 0.1) {
				conditionHealth = 5;
			} else {
				conditionHealth = 6;
			}
		}

		let update = {};
		update["condition_health"] = conditionHealth;
		setAttrs(update);
	});
});

let toInt = function (value) {
	return (value && !isNaN(value)) ? parseInt(value) : 0;
};

let clamp = function (value, min, max) {
	return Math.min(Math.max(value, min), max);
};

let isDefined = function (value) {
	return value !== null && typeof(value) !== 'undefined';
};
