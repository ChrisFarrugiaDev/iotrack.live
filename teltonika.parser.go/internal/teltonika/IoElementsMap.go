package teltonika

var IOIDToNameFMC130FMP100 = []struct {
	ID   int
	Name string
}{
	{1, "digital_input_1"},
	{2, "digital_input_2"},
	{3, "digital_input_3"},
	{4, "pulse_counter_din1"},
	{5, "pulse_counter_din2"},
	{6, "analog_input_2"},
	{9, "analog_input_1"},
	{10, "sd_status"},
	{11, "iccid1"},
	{12, "fuel_used_gps"},
	{13, "fuel_rate_gps"},
	{15, "eco_score"},
	{16, "total_odometer"},
	{17, "axis_x"},
	{18, "axis_y"},
	{19, "axis_z"},
	{21, "gsm_signal"},
	{24, "speed"},
	{66, "external_voltage"},
	{67, "battery_voltage"},
	{68, "battery_current"},
	{69, "gnss_status"},
	{71, "dallas_temperature_id_4"},
	{72, "dallas_temperature_1"},
	{73, "dallas_temperature_2"},
	{74, "dallas_temperature_3"},
	{75, "dallas_temperature_4"},
	{76, "dallas_temperature_id_1"},
	{77, "dallas_temperature_id_2"},
	{78, "ibutton"},
	{79, "dallas_temperature_id_3"},
	{80, "data_mode"},
	{113, "battery_level"},
	{179, "digital_output_1"},
	{180, "digital_output_2"},
	{181, "gnss_pdop"},
	{182, "gnss_hdop"},
	{199, "trip_odometer"},
	{200, "sleep_mode"},
	{205, "gsm_cell_id"},
	{206, "gsm_area_code"},
	{207, "rfid"},
	{237, "network_type"},
	{238, "user_id"},
	{239, "ignition"},
	{240, "movement"},
	{241, "active_gsm_operator"},
	{263, "bt_status"},
	{264, "barcode_id"},
	{303, "instant_movement"},
	{327, "ul202_02_sensor_fuel_level"},
	{380, "digital_output_3"},
	{381, "ground_sense"},
	{383, "axl_calibration_status"},
	{387, "iso6709_coordinates"},
	{403, "driver_name"},
	{404, "driver_card_license_type"},
	{405, "driver_gender"},
	{406, "driver_card_id"},
	{407, "driver_card_expiration_date"},
	{408, "driver_card_place_of_issue"},
	{409, "driver_status_event"},
	{622, "frequency_din1"},
	{623, "frequency_din2"},
	{636, "umts_lte_cell_id"},
	{637, "wake_reason"},
	{1148, "connectivity_quality"},

	{10800, "eye_temperature_1"},
	{10801, "eye_temperature_2"},
	{10802, "eye_temperature_3"},
	{10803, "eye_temperature_4"},
	{10804, "eye_humidity_1"},
	{10805, "eye_humidity_2"},
	{10806, "eye_humidity_3"},
	{10807, "eye_humidity_4"},
	{10808, "eye_magnet_1"},
	{10809, "eye_magnet_2"},
	{10810, "eye_magnet_3"},
	{10811, "eye_magnet_4"},
	{10812, "eye_movement_1"},
	{10813, "eye_movement_2"},
	{10814, "eye_movement_3"},
	{10815, "eye_movement_4"},
	{10816, "eye_pitch_1"},
	{10817, "eye_pitch_2"},
	{10818, "eye_pitch_3"},
	{10819, "eye_pitch_4"},
	{10820, "eye_low_battery_1"},
	{10821, "eye_low_battery_2"},
	{10822, "eye_low_battery_3"},
	{10823, "eye_low_battery_4"},
	{10824, "eye_battery_voltage_1"},
	{10825, "eye_battery_voltage_2"},
	{10826, "eye_battery_voltage_3"},
	{10827, "eye_battery_voltage_4"},
	{10832, "eye_roll_1"},
	{10833, "eye_roll_2"},
	{10834, "eye_roll_3"},
	{10835, "eye_roll_4"},
	{10836, "eye_movement_count_1"},
	{10837, "eye_movement_count_2"},
	{10838, "eye_movement_count_3"},
	{10839, "eye_movement_count_4"},
	{10840, "eye_magnet_count_1"},
	{10841, "eye_magnet_count_2"},
	{10842, "eye_magnet_count_3"},
	{10843, "eye_magnet_count_4"},

	{451, "ble_rfid_1"},
	{452, "ble_rfid_2"},
	{453, "ble_rfid_3"},
	{454, "ble_rfid_4"},
	{455, "ble_button_1_state_1"},
	{456, "ble_button_1_state_2"},
	{457, "ble_button_1_state_3"},
	{458, "ble_button_1_state_4"},
	{459, "ble_button_2_state_1"},
	{460, "ble_button_2_state_2"},
	{461, "ble_button_2_state_3"},
	{462, "ble_button_2_state_4"},

	{14, "iccid2"},

	{61, "geofence_zone_06"},
	{62, "geofence_zone_07"},
	{63, "geofence_zone_08"},
	{64, "geofence_zone_09"},
	{65, "geofence_zone_10"},
	{70, "geofence_zone_11"},
	{88, "geofence_zone_12"},
	{91, "geofence_zone_13"},
	{92, "geofence_zone_14"},
	{93, "geofence_zone_15"},
	{94, "geofence_zone_16"},
	{95, "geofence_zone_17"},
	{96, "geofence_zone_18"},
	{97, "geofence_zone_19"},
	{98, "geofence_zone_20"},
	{99, "geofence_zone_21"},
	{153, "geofence_zone_22"},
	{154, "geofence_zone_23"},
	{155, "geofence_zone_01"},
	{156, "geofence_zone_02"},
	{157, "geofence_zone_03"},
	{158, "geofence_zone_04"},
	{159, "geofence_zone_05"},
	{175, "auto_geofence"},
	{190, "geofence_zone_24"},
	{191, "geofence_zone_25"},
	{192, "geofence_zone_26"},
	{193, "geofence_zone_27"},
	{194, "geofence_zone_28"},
	{195, "geofence_zone_29"},
	{196, "geofence_zone_30"},
	{197, "geofence_zone_31"},
	{198, "geofence_zone_32"},
	{208, "geofence_zone_33"},
	{209, "geofence_zone_34"},
	{216, "geofence_zone_35"},
	{217, "geofence_zone_36"},
	{218, "geofence_zone_37"},
	{219, "geofence_zone_38"},
	{220, "geofence_zone_39"},
	{221, "geofence_zone_40"},
	{222, "geofence_zone_41"},
	{223, "geofence_zone_42"},
	{224, "geofence_zone_43"},
	{225, "geofence_zone_44"},
	{226, "geofence_zone_45"},
	{227, "geofence_zone_46"},
	{228, "geofence_zone_47"},
	{229, "geofence_zone_48"},
	{230, "geofence_zone_49"},
	{231, "geofence_zone_50"},

	{236, "alarm"},
	{243, "green_driving_event_duration"},
	{246, "towing"},
	{247, "crash_detection"},
	{248, "immobilizer"},
	{249, "jamming"},
	{250, "trip"},
	{251, "idling"},
	{252, "unplug"},
	{253, "green_driving_type"},
	{254, "green_driving_value"},
	{255, "over_speeding"},
	{257, "crash_trace_data"},
	{258, "eco_maximum"},           // FMT100
	{259, "eco_average"},           // FMT100
	{260, "eco_duration"},          // FMT100
	{283, "driving_state"},         // FMT100
	{284, "driving_records"},       // FMT100
	{285, "blood_alcohol_content"}, // FMB125
	{317, "crash_event_counter"},
	{318, "gnss_jamming"},
	{391, "private_mode"},
	{449, "ignition_on_counter"},
	{1412, "motorcycle_fall_detection"}, // FMB965

	{30, "obd_num_dtc"},
	{31, "obd_engine_load"},
	{32, "obd_coolant_temperature"},
	{33, "obd_short_fuel_trim"},
	{34, "obd_fuel_pressure"},
	{35, "obd_intake_map"},
	{36, "obd_engine_rpm"},
	{37, "obd_vehicle_speed"},
	{38, "obd_timing_advance"},
	{39, "obd_intake_air_temperature"},
	{40, "obd_maf"},
	{41, "obd_throttle_position"},
	{42, "obd_runtime_since_engine_start"},
	{43, "obd_distance_mil_on"},
	{44, "obd_relative_fuel_rail_pressure"},
	{45, "obd_direct_fuel_rail_pressure"},
	{46, "obd_commanded_egr"},
	{47, "obd_egr_error"},
	{48, "obd_fuel_level"},
	{49, "obd_distance_since_codes_cleared"},
	{50, "obd_barometric_pressure"},
	{51, "obd_control_module_voltage"},
	{52, "obd_absolute_load_value"},
	{53, "obd_ambient_air_temperature"},
	{54, "obd_time_run_with_mil_on"},
	{55, "obd_time_since_codes_cleared"},
	{56, "obd_absolute_fuel_rail_pressure"},
	{57, "obd_hybrid_battery_pack_life"},
	{58, "obd_engine_oil_temperature"},
	{59, "obd_fuel_injection_timing"},
	{60, "obd_fuel_rate"},
	{256, "obd_vin"},
	{759, "obd_fuel_type"},
	{281, "obd_fault_codes"},
	{540, "obd_throttle_position_group"},
	{541, "obd_commanded_equivalence_ratio"},
	{542, "obd_intake_map_2bytes"},
	{543, "obd_hybrid_system_voltage"},
	{544, "obd_hybrid_system_current"},

	{389, "obd_oem_total_mileage"},
	{390, "obd_oem_fuel_level"},
	{402, "oem_distance_until_service"},
	{410, "oem_battery_charge_state"},
	{411, "oem_battery_charge_level"},
	{755, "oem_remaining_distance"},
	{1151, "oem_battery_state_of_health"},
	{1152, "oem_battery_temperature"},

	{385, "ble_beacon_list"},
	{548, "ble_advanced_beacon_data"},

	{25, "ble_temperature_1"},
	{26, "ble_temperature_2"},
	{27, "ble_temperature_3"},
	{28, "ble_temperature_4"},

	{29, "ble_battery_1"},
	{20, "ble_battery_2"},
	{22, "ble_battery_3"},
	{23, "ble_battery_4"},

	{86, "ble_humidity_1"},
	{104, "ble_humidity_2"},
	{106, "ble_humidity_3"},
	{108, "ble_humidity_4"},

	{270, "ble_fuel_level_1"},
	{273, "ble_fuel_level_2"},
	{276, "ble_fuel_level_3"},
	{279, "ble_fuel_level_4"},

	{306, "ble_fuel_frequency_1"},
	{307, "ble_fuel_frequency_2"},
	{308, "ble_fuel_frequency_3"},
	{309, "ble_fuel_frequency_4"},

	{335, "ble_luminosity_1"},
	{336, "ble_luminosity_2"},
	{337, "ble_luminosity_3"},
	{338, "ble_luminosity_4"},

	{331, "ble_1_custom_1"},
	{463, "ble_1_custom_2"},
	{464, "ble_1_custom_3"},
	{465, "ble_1_custom_4"},
	{466, "ble_1_custom_5"},

	{332, "ble_2_custom_1"},
	{467, "ble_2_custom_2"},
	{468, "ble_2_custom_3"},
	{469, "ble_2_custom_4"},
	{470, "ble_2_custom_5"},

	{333, "ble_3_custom_1"},
	{471, "ble_3_custom_2"},
	{472, "ble_3_custom_3"},
	{473, "ble_3_custom_4"},
	{474, "ble_3_custom_5"},

	{334, "ble_4_custom_1"},
	{475, "ble_4_custom_2"},
	{476, "ble_4_custom_3"},
	{477, "ble_4_custom_4"},
	{478, "ble_4_custom_5"},

	{81, "can_vehicle_speed"},
	{82, "can_accelerator_pedal_position"},
	{83, "can_fuel_consumed"},
	{84, "can_fuel_level"},
	{85, "can_engine_rpm"},
	{87, "can_total_mileage"},
	{89, "can_fuel_level_percent"},
	{90, "can_door_status"},
	{100, "can_program_number"},
	{101, "can_module_id_8b"},
	{388, "can_module_id_17b"},
	{102, "can_engine_worktime"},
	{103, "can_engine_worktime_counted"},
	{105, "can_total_mileage_counted"},
	{107, "can_fuel_consumed_counted"},
	{110, "can_fuel_rate"},
	{111, "can_adblue_level_percent"},
	{112, "can_adblue_level_liters"},
	{114, "can_engine_load"},
	{115, "can_engine_temperature"},
	{118, "can_axle1_load"},
	{119, "can_axle2_load"},
	{120, "can_axle3_load"},
	{121, "can_axle4_load"},
	{122, "can_axle5_load"},
	{123, "can_control_state_flags"},
	{124, "can_agri_machinery_flags"},
	{125, "can_harvesting_time"},
	{126, "can_area_of_harvest"},
	{127, "can_mowing_efficiency"},
	{128, "can_grain_mown_volume"},
	{129, "can_grain_moisture"},
	{130, "can_harvesting_drum_rpm"},
	{131, "can_gap_under_drum"},
	{132, "can_security_state_flags"},
	{133, "can_tacho_total_vehicle_distance"},
	{134, "can_trip_distance"},
	{135, "can_tacho_vehicle_speed"},
	{136, "can_tacho_driver_card_presence"},
	{137, "can_driver1_states"},
	{138, "can_driver2_states"},
	{139, "can_driver1_continuous_driving_time"},
	{140, "can_driver2_continuous_driving_time"},
	{141, "can_driver1_cumulative_break_time"},
	{142, "can_driver2_cumulative_break_time"},
	{143, "can_driver1_selected_activity_duration"},
	{144, "can_driver2_selected_activity_duration"},
	{145, "can_driver1_cumulative_driving_time"},
	{146, "can_driver2_cumulative_driving_time"},
	{147, "can_driver1_id_high"},
	{148, "can_driver1_id_low"},
	{149, "can_driver2_id_high"},
	{150, "can_driver2_id_low"},
	{151, "can_battery_temperature"},
	{152, "can_hv_battery_level_percent"},
	{160, "can_dtc_faults_count"},
	{161, "can_slope_of_arm"},
	{162, "can_rotation_of_arm"},
	{163, "can_eject_of_arm"},
	{164, "can_horizontal_distance_arm_vehicle"},
	{165, "can_height_arm_above_ground"},
	{166, "can_drill_rpm"},
	{167, "can_amount_spread_salt_m2"},
	{168, "can_battery_voltage"},
	{169, "can_spread_fine_grained_salt"},
	{170, "can_spread_coarse_grained_salt"},
	{171, "can_spread_dimix"},
	{172, "can_spread_coarse_grained_calcium"},
	{173, "can_spread_calcium_chloride"},
	{174, "can_spread_sodium_chloride"},
	{176, "can_spread_magnesium_chloride"},
	{177, "can_spread_gravel"},
	{178, "can_spread_sand"},
	{183, "can_width_pouring_left"},
	{184, "can_width_pouring_right"},
	{185, "can_salt_spreader_working_hours"},
	{186, "can_distance_during_salting"},
	{187, "can_load_weight"},
	{188, "can_retarder_load"},
	{189, "can_cruise_time"},
	{232, "can_cng_status"},
	{233, "can_cng_used"},
	{234, "can_cng_level_percent"},
	{235, "can_oil_level_indicator"},
	{304, "can_vehicle_range_on_battery"},
	{305, "can_vehicle_range_on_additional_fuel"},
	{325, "can_vin"},
	{282, "can_fault_codes"},
	{517, "can_security_state_flags_p4"},
	{518, "can_control_state_flags_p4"},
	{519, "can_indicator_state_flags_p4"},
	{520, "can_agri_state_flags_p4"},
	{521, "can_utility_state_flags_p4"},
	{522, "can_cistern_state_flags_p4"},
	{855, "can_lng_used"},
	{856, "can_lng_used_counted"},
	{857, "can_lng_level_percent"},
	{858, "can_lng_level_kg"},
	{1100, "can_total_lpg_used"},
	{1101, "can_total_lpg_used_counted"},
	{1102, "can_lpg_level_percent"},
	{1103, "can_lpg_level_liters"},
	{898, "ssf_ignition"},
	{652, "ssf_key_in_ignition_lock"},
	{899, "ssf_webasto"},
	{900, "ssf_engine_working"},
	{901, "ssf_standalone_engine"},
	{902, "ssf_ready_to_drive"},
	{903, "ssf_engine_working_on_cng"},
	{904, "ssf_work_mode"},
	{905, "ssf_operator"},
	{906, "ssf_interlock"},
	{907, "ssf_engine_lock_active"},
	{908, "ssf_request_to_lock_engine"},
	{653, "ssf_handbrake_active"},
	{910, "ssf_footbrake_active"},
	{911, "ssf_clutch_pushed"},
	{912, "ssf_hazard_warning_lights"},
	{654, "ssf_front_left_door_open"},
	{655, "ssf_front_right_door_open"},
	{656, "ssf_rear_left_door_open"},
	{657, "ssf_rear_right_door_open"},
	{658, "ssf_trunk_door_open"},
	{913, "ssf_engine_cover_open"},
	{909, "ssf_roof_open"},
	{914, "ssf_charging_wire_plugged"},
	{915, "ssf_battery_charging"},
	{916, "ssf_electric_engine_state"},
	{917, "ssf_car_closed_factory_remote"},
	{662, "ssf_car_is_closed"},
	{918, "ssf_factory_alarm_actuated"},
	{919, "ssf_factory_alarm_emulated"},
	{920, "ssf_signal_close_factory_remote"},
	{921, "ssf_signal_open_factory_remote"},
	{922, "ssf_rearming_signal"},
	{923, "ssf_trunk_door_opened_factory_remote"},
	{924, "ssf_can_module_in_sleep"},
	{925, "ssf_factory_remote_3x"},
	{926, "ssf_factory_armed"},
	{660, "ssf_parking_gear_active"},
	{661, "ssf_reverse_gear_active"},
	{659, "ssf_neutral_gear_active"},
	{927, "ssf_drive_is_active"},
	{1083, "ssf_engine_working_on_dual_fuel"},
	{1084, "ssf_engine_working_on_lpg"},
	{928, "csf_parking_lights"},
	{929, "csf_dipped_head_lights"},
	{930, "csf_full_beam_headlights"},
	{931, "csf_rear_fog_lights"},
	{932, "csf_front_fog_lights"},
	{933, "csf_additional_front_lights"},
	{934, "csf_additional_rear_lights"},
	{935, "csf_light_signal"},
	{936, "csf_air_conditioning"},
	{937, "csf_cruise_control"},
	{938, "csf_automatic_retarder"},
	{939, "csf_manual_retarder"},
	{940, "csf_drivers_seatbelt_fastened"},
	{941, "csf_front_drivers_seatbelt_fastened"},
	{942, "csf_left_drivers_seatbelt_fastened"},
	{943, "csf_right_drivers_seatbelt_fastened"},
	{944, "csf_centre_drivers_seatbelt_fastened"},
	{945, "csf_front_passenger_present"},
	{946, "csf_pto"},
	{947, "csf_front_differential_locked"},
	{948, "csf_rear_differential_locked"},
	{949, "csf_central_differential_4hi_locked"},
	{950, "csf_rear_differential_4lo_locked"},
	{951, "csf_trailer_axle1_lift_active"},
	{952, "csf_trailer_axle2_lift_active"},
	{1085, "csf_trailer_connected"},
	{1086, "csf_start_stop_system_inactive"},
	{953, "isf_check_engine_indicator"},
	{954, "isf_abs_indicator"},
	{955, "isf_esp_indicator"},
	{956, "isf_esp_turned_off"},
	{957, "isf_stop_indicator"},
	{958, "isf_oil_level_indicator"},
	{959, "isf_coolant_liquid_level"},
	{960, "isf_battery_not_charging_indicator"},
	{961, "isf_handbrake_system_indicator"},
	{962, "isf_airbag_indicator"},
	{963, "isf_eps_indicator"},
	{964, "isf_warning_indicator"},
	{965, "isf_lights_failure_indicator"},
	{966, "isf_low_tire_pressure_indicator"},
	{967, "isf_wear_of_brake_pads_indicator"},
	{968, "isf_low_fuel_level_indicator"},
	{969, "isf_maintenance_required_indicator"},
	{970, "isf_glow_plug_indicator"},
	{971, "isf_fap_indicator"},
	{972, "isf_epc_indicator"},
	{973, "isf_clogged_engine_oil_filter_indicator"},
	{974, "isf_low_engine_oil_pressure_indicator"},
	{975, "isf_too_high_engine_oil_temperature_indicator"},
	{976, "isf_low_coolant_level_indicator"},
	{977, "isf_clogged_hydraulic_system_oil_filter_indicator"},
	{978, "isf_hydraulic_system_low_pressure_indicator"},
	{979, "isf_hydraulic_oil_low_level_indicator"},
	{980, "isf_hydraulic_system_high_temperature_indicator"},
	{981, "isf_oil_overflow_in_hydraulic_chamber_indicator"},
	{982, "isf_clogged_air_filter_indicator"},
	{983, "isf_clogged_fuel_filter_indicator"},
	{984, "isf_water_in_fuel_indicator"},
	{985, "isf_clogged_brake_system_filter_indicator"},
	{986, "isf_low_washer_fluid_level_indicator"},
	{987, "isf_low_adblue_level_indicator"},
	{988, "isf_low_trailer_tyre_pressure_indicator"},
	{989, "isf_wear_of_trailer_brake_lining_indicator"},
	{990, "isf_high_trailer_brake_temperature_indicator"},
	{991, "isf_incorrect_trailer_pneumatic_supply_indicator"},
	{992, "isf_low_cng_level_indicator"},
	{993, "asf_right_joystick_right_active"},
	{994, "asf_right_joystick_left_active"},
	{995, "asf_right_joystick_forward_active"},
	{996, "asf_right_joystick_back_active"},
	{997, "asf_left_joystick_right_active"},
	{998, "asf_left_joystick_left_active"},
	{999, "asf_left_joystick_forward_active"},
	{1000, "asf_left_joystick_back_active"},
	{1001, "asf_first_rear_hydraulic"},
	{1002, "asf_second_rear_hydraulic"},
	{1003, "asf_third_rear_hydraulic"},
	{1004, "asf_fourth_rear_hydraulic"},
	{1005, "asf_first_front_hydraulic"},
	{1006, "asf_second_front_hydraulic"},
	{1007, "asf_third_front_hydraulic"},
	{1008, "asf_fourth_front_hydraulic"},
	{1009, "asf_front_three_point_hitch"},
	{1010, "asf_rear_three_point_hitch"},
	{1011, "asf_front_power_takeoff"},
	{1012, "asf_rear_power_takeoff"},
	{1013, "asf_mowing_active"},
	{1014, "asf_threshing_active"},
	{1015, "asf_grain_release_from_hopper"},
	{1016, "asf_grain_tank_100_full"},
	{1017, "asf_grain_tank_70_full"},
	{1018, "asf_grain_tank_opened"},
	{1019, "asf_unloader_drive"},
	{1020, "asf_cleaning_fan_control_off"},
	{1021, "asf_threshing_drum_control_off"},
	{1022, "asf_straw_walker_clogged"},
	{1023, "asf_excessive_clearance_under_threshing_drum"},
	{1024, "asf_low_temp_drive_system_hydraulics"},
	{1025, "asf_high_temp_drive_system_hydraulics"},
	{1026, "asf_ear_auger_speed_below_norm"},
	{1027, "asf_grain_auger_speed_below_norm"},
	{1028, "asf_straw_chopper_speed_below_norm"},
	{1029, "asf_straw_shaker_speed_below_norm"},
	{1030, "asf_feeder_speed_below_norm"},
	{1031, "asf_straw_chopper_on"},
	{1032, "asf_corn_header_connected"},
	{1033, "asf_grain_header_connected"},
	{1034, "asf_feeder_reverse_on"},
	{1035, "asf_pressure_filter_hydraulic_pump_clogged"},
	{1087, "asf_adapter_pressure_filter_sensor"},
	{1088, "asf_service_2_required"},
	{1089, "asf_drain_filter_clogged"},
	{1090, "asf_section1_spraying"},
	{1091, "asf_section2_spraying"},
	{1092, "asf_section3_spraying"},
	{1093, "asf_section4_spraying"},
	{1094, "asf_section5_spraying"},
	{1095, "asf_section6_spraying"},
	{1096, "asf_section7_spraying"},
	{1097, "asf_section8_spraying"},
	{1098, "asf_section9_spraying"},
	{1036, "usf_spreading"},
	{1037, "usf_pouring_chemicals"},
	{1038, "usf_conveyor_belt"},
	{1039, "usf_salt_spreader_drive_wheel"},
	{1040, "usf_brushes"},
	{1041, "usf_vacuum_cleaner"},
	{1042, "usf_water_supply"},
	{1043, "usf_spreading2"},
	{1044, "usf_liquid_pump"},
	{1045, "usf_unloading_from_hopper"},
	{1046, "usf_low_salt_sand_level"},
	{1047, "usf_low_water_level"},
	{1048, "usf_chemicals"},
	{1049, "usf_compressor"},
	{1050, "usf_water_valve_opened"},
	{1051, "usf_cabin_moved_up"},
	{1052, "usf_cabin_moved_down"},
	{1099, "usf_hydraulics_work_not_permitted"},
	{1053, "cisf_section1_fluid_downpipe"},
	{1054, "cisf_section1_filled"},
	{1055, "cisf_section1_overfilled"},
	{1056, "cisf_section2_fluid_downpipe"},
	{1057, "cisf_section2_filled"},
	{1058, "cisf_section2_overfilled"},
	{1059, "cisf_section3_fluid_downpipe"},
	{1060, "cisf_section3_filled"},
	{1061, "cisf_section3_overfilled"},
	{1062, "cisf_section4_fluid_downpipe"},
	{1063, "cisf_section4_filled"},
	{1064, "cisf_section4_overfilled"},
	{1065, "cisf_section5_fluid_downpipe"},
	{1066, "cisf_section5_filled"},
	{1067, "cisf_section5_overfilled"},
	{1068, "cisf_section6_fluid_downpipe"},
	{1069, "cisf_section6_filled"},
	{1070, "cisf_section6_overfilled"},
	{1071, "cisf_section7_fluid_downpipe"},
	{1072, "cisf_section7_filled"},
	{1073, "cisf_section7_overfilled"},
	{1074, "cisf_section8_fluid_downpipe"},
	{1075, "cisf_section8_filled"},
	{1076, "cisf_section8_overfilled"},
	{400, "can_distance_to_next_service"},
	{450, "can_cng_level_kg"},
	{859, "can_distance_from_need_of_service"},
	{860, "can_distance_from_last_service"},
	{861, "can_time_to_next_service"},
	{862, "can_time_from_need_of_service"},
	{863, "can_time_from_last_service"},
	{864, "can_distance_to_next_oil_service"},
	{865, "can_time_to_next_oil_service"},
	{866, "can_vehicle_range"},
	{867, "can_total_cng_counted"},
	{1079, "can_total_bale_count"},
	{1080, "can_bale_count"},
	{1081, "can_cut_bale_count"},
	{1082, "can_bale_slices"},
	{1116, "can_max_road_speed"},
	{1117, "can_exceeded_road_speed"},
	{1205, "can_rsf_speed_limit_sign"},
	{1206, "can_rsf_end_of_speed_limit_sign"},
	{1207, "can_rsf_speed_exceeded"},
	{1208, "can_rsf_time_speed_limit_sign"},
	{1209, "can_rsf_weather_speed_limit_sign"},
}
