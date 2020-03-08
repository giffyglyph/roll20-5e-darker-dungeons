$(document).ready(function() {

	createFieldsets();
	formatInputs();
	setupTestData();

	function createFieldsets() {
		var fieldsetCounter = 1;

		$("fieldset[class^='repeating_']").each(function(i) {
			$(this).hide();
			$(this).after("<div class='repcontrol'><button class='btn repcontrol_edit'>Modify</button><button class='btn repcontrol_add'>+Add</button></div>");
			$(this).after("<div class='repcontainer'></div>");
		});

		$(".repcontrol_add").click(function() {
			let parent = $(this).parent().parent();
			let fieldset = $(parent).find("fieldset").first();
			let fieldsetItem = $(fieldset).html().replace(/name="attr_/g, "name=\"fs" + fieldsetCounter + "_attr_");

			fieldsetCounter++

			let repitem = $("<div class='repitem'><div class='itemcontrol'><button class='btn btn-danger pictos repcontrol_del'>#</button><a class='btn repcontrol_move'>≡</a></div></div>");
			$(repitem).find('.btn-danger').click(function() {
				$(this).parent().parent().remove();
			});

			$(repitem).append(fieldsetItem);
			$(repitem).find("input, select, textarea").change(function(e) {
				if (e.originalEvent){
					let value = $(this).val();
					let checked = $(this).prop("checked");
					let attribute = "[name='" + $(this).attr("name") + "']";

					$(attribute).each(function(i) {

						if($(this).is("input") && ($(this).attr("type") == 'text' || $(this).attr("type") == 'hidden')) {
							$(this).val(value);
						} else if($(this).is("input") && $(this).attr("type") == 'checkbox') {
							$(this).prop("checked", checked);
						} else if($(this).is("span")) {
							$(this).html(value);
						} else if($(this).is("select")) {
							$(this).val(value);
						}
					});
				}
			});

			$(parent).find(".repcontainer").first().append($(repitem));
		});

		$(".repcontrol_edit").click(function() {
			let parent = $(this).closest(".repcontrol");
			$(parent).prev().toggleClass("editmode");
		});
	}

	function formatInputs() {

		$("button[type=roll]").each(function(i) {
			$(this).addClass("btn ui-draggable");
		});

		$("input, select, textarea").change(function(e) {

			if (e.originalEvent){
				let value = $(this).val();
				if ($(this).attr("type") == 'checkbox') {
					value = $(this).prop("checked") ? $(this).val() : 0;
				}

				let checked = $(this).prop("checked");
				let attribute = "[name='" + $(this).attr("name") + "']";

				$(attribute).each(function(i) {

					if($(this).is("input") && ($(this).attr("type") == 'text' || $(this).attr("type") == 'hidden')) {
						$(this).val(value);
					} else if($(this).is("input") && $(this).attr("type") == 'checkbox') {
						$(this).prop("checked", checked);
					} else if($(this).is("span")) {
						$(this).html(value);
					} else if($(this).is("select")) {
						$(this).val(value);
					}
				});
			}
		});
	}

	function setCheck(field, state) {
		$("[name='attr_" + field + "']").prop("checked", state);
	}

	function setText(fields, text) {
		[].concat(fields).forEach(function(field) {
			$("[name='attr_" + field + "']").html(text);
			$("[name='attr_" + field + "']").val(text);
		});
	}

	function setValue(fields, value) {
		[].concat(fields).forEach(function(field) {
			$("[name='attr_" + field + "']").attr("value", value);
		});
	}

	function setupTestData() {

		// defaults
		setValue("npc", "0");
		setText("npc_name", "Lich");
		setText("npc_type", "Medium undead, Any Evil Alignment");
		setText("npc_ac", "17");
		setText("npc_actype", "Natural Armor");
		setText("hp_max", "135");
		setText("npc_hpformula", "18d8+54");
		setText("npc_speed", "30 ft");
		setText(["strength_base", "strength"], "11");
		setText(["dexterity_base", "dexterity"], "16");
		setText(["intelligence_base", "intelligence"], "20");
		setText(["constitution_base", "constitution"], "16");
		setText(["wisdom_base", "wisdom"], "14");
		setText(["charisma_base", "charisma"], "16");
		setText("strength_mod", "0");
		setText("dexterity_mod", "3");
		setText("constitution_mod", "3");
		setText("intelligence_mod", "5");
		setText("wisdom_mod", "2");
		setText("charisma_mod", "3");
		setText("npc_str_save_base", "0");
		setText("npc_dex_save_base", "0");
		setText(["npc_con_save_base", "npc_con_save"], "10");
		setText(["npc_int_save_base", "npc_int_save"], "12");
		setText(["npc_wis_save_base", "npc_wis_save"], "9");
		setText("npc_cha_save_base", "0");
		setValue(["npc_con_save_flag", "npc_int_save_flag"], 1);
		setValue("npc_wis_save_flag", 2);
		setValue(["npc_skills_flag", "npc_arcana_flag", "npc_history_flag", "npc_insight_flag"], 1);
		setValue("npc_perception_flag", 2);
		setText("npc_arcana", "18");
		setText("npc_history", "12");
		setText("npc_insight", "9");
		setText("npc_perception", "9");
		setText("npc_resistances", "Cold, Lightning, Necrotic");
		setText("npc_immunities", "Poison; Bludgeoning, Piercing, And Slashing From Nonmagical Weapons");
		setText("npc_condition_immunities", "Charmed, Exhaustion, Frightened, Paralyzed, Poisoned");
		setText("npc_senses", "Truesight 120 Ft., passive Perception 19");
		setText("npc_languages", "Common Plus Up To Five Other Languages");
		setText("npc_challenge", "21");
		setText("npc_xp", "33000");
		setText("ac", "17");
		setText("initiative_bonus", "5");
		setText("passive_wisdom", "10");
		setText("speed", "30 ft");
		setText("hp", "12");
		setText("hp_temp", "10");
		setText("hit_dice", "1");
		setText("hit_dice_max", "4");
		setText("exhaustion_base", "1");
		setText("exhaustion_wounds", "+1");
		setText("exhaustion_conditions", "+2");
		setText("exhaustion_total", "4");
		setText("stress", "13");
	}
});
