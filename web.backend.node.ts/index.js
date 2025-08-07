let $injector = widgetContext.$scope.$injector;
let customDialog = $injector.get(widgetContext.servicesMap.get('customDialog'));
let attributeService = $injector.get(widgetContext.servicesMap.get('attributeService'));

// ---------------------------------------------------------------------

openSetThresholdsDialog();

let initialRelativeFields = null;

function openSetThresholdsDialog() {
    customDialog.customDialog(htmlTemplate, SetThresholdsDialogController).subscribe();
}

// ---------------------------------------------------------------------

function SetThresholdsDialogController(instance) {
    let vm = instance;
    vm.cancel = () => vm.dialogRef.close(null);

    
    instance.vm = vm;

    setTimeout(() => {
        if (typeof flatpickr === 'undefined') {
            console.error("Flatpickr is not loaded.");
            return;
        }

        ['startsOn', 'endsOn', 'startsOn1', 'endsOn1'].forEach(id => {
            const input = document.getElementById(id);
            if (input) {
                flatpickr(input, {
                    enableTime: true,
                    noCalendar: true,
                    dateFormat: "H:i",
                    time_24hr: true,
                    defaultDate: input.value || null,
                    onChange: function (selectedDates, dateStr) {
                        const control = vm.thresholdFormGroup.get(id);
                        if (control) {
                            control.setValue(dateStr);
                            control.markAsDirty();
                            vm.thresholdFormGroup.markAsDirty();
                        }
                    }
                });

                // Also handle manual typing (in case the user types in the input)
                input.addEventListener('input', function (e) {
                    const val = e.target.value;
                    const control = vm.thresholdFormGroup.get(id);
                    if (control) {
                        control.setValue(val);
                        control.markAsDirty();
                        vm.thresholdFormGroup.markAsDirty();
                    }
                });
            }
        });
    }, 500);

    vm.days = [
        { label: 'Monday', value: 1 },
        { label: 'Tuesday', value: 2 },
        { label: 'Wednesday', value: 3 },
        { label: 'Thursday', value: 4 },
        { label: 'Friday', value: 5 },
        { label: 'Saturday', value: 6 },
        { label: 'Sunday', value: 7 }
    ];

    vm.defaultTimezone = "Europe/Malta";

    // Initialize the form group
    vm.thresholdFormGroup = vm.fb.group({
        percentageOverThreshold: [null, [vm.validators.min(0), vm.validators.max(100)]], // Added max(100)
        percentageUnderThreshold: [null, [vm.validators.min(0), vm.validators.max(100)]], // Added max(100)
        percentageChangePlus: [null, [vm.validators.min(0)]],
        percentageChangeNeg: [null, [vm.validators.min(0)]],
        delayInMin: [null, [vm.validators.min(0)]], delayInMinChg: [null, [vm.validators.min(0)]], daysOfWeek: [[], [vm.validators.required]], timezone: [vm.defaultTimezone, [vm.validators.required]], startsOn: ['00:00', [vm.validators.required]], endsOn: ['23:59', [vm.validators.required]], startsOn1: [null], endsOn1: [null], receiveEmail: [false], receiveSms: [false], receiveVoice: [false]
    });

    vm.restoreDefaultTime = function () {
        const startsOnCtrl = vm.thresholdFormGroup.get('startsOn');
        const endsOnCtrl = vm.thresholdFormGroup.get('endsOn');

        startsOnCtrl.setValue('00:00');
        endsOnCtrl.setValue('23:59');

        // Manually update flatpickr UI (mobile fix)
        const startsInput = document.getElementById('startsOn');
        const endsInput = document.getElementById('endsOn');

        if (startsInput && startsInput._flatpickr) {
            startsInput._flatpickr.setDate('00:00', true);
        }
        if (endsInput && endsInput._flatpickr) {
            endsInput._flatpickr.setDate('23:59', true);
        }
        vm.thresholdFormGroup.markAsDirty(); // 👈 This marks the form as dirty


    };

    vm.restoreDefaultTime1 = function () {
        const startsOnCtrl = vm.thresholdFormGroup.get('startsOn1');
        const endsOnCtrl = vm.thresholdFormGroup.get('endsOn1');

        //vm.thresholdFormGroup.markAsDirty(); // 👈 This marks the form as dirty
        startsOnCtrl.setValue('00:00');
        endsOnCtrl.setValue('23:59');

        // Manually update flatpickr UI (mobile fix)
        const startsInput1 = document.getElementById('startsOn1');
        const endsInput1 = document.getElementById('endsOn1');

        if (startsInput1 && startsInput1._flatpickr) {
            startsInput1._flatpickr.setDate('00:00', true);
        }
        if (endsInput1 && endsInput1._flatpickr) {
            endsInput1._flatpickr.setDate('23:59', true);
        }

        vm.thresholdFormGroup.markAsDirty();
    };

    vm.getExistingValue = function () {
        attributeService.getEntityAttributes(entityId, 'SERVER_SCOPE', null).subscribe(
            function (attributes) {

                let absAttr = attributes.find(attr => attr.key === 'percentageAbsoluteLevelAlert');
                let relAttr = attributes.find(attr => attr.key === 'percentageRelativeLevelAlert');
                let notifAttr = attributes.find(attr => attr.key === 'percentageAlertNotificationSettings');

                let abs = {}, rel = {}, notif = {};

                try {

                    if (absAttr) {
                        abs = typeof absAttr.value === "string"
                            ? JSON.parse(absAttr.value)
                            : absAttr.value;
                    }
                    if (relAttr) {
                        rel = typeof relAttr.value === "string"
                            ? JSON.parse(relAttr.value)
                            : relAttr.value;
                    }
                    if (notifAttr) {
                        notif = typeof notifAttr.value === "string"
                            ? JSON.parse(notifAttr.value)
                            : notifAttr.value;
                    }

                    initialRelativeFields = {
                        daysOfWeek: Array.isArray(rel.daysOfWeek) ? rel.daysOfWeek : [1,2,3,4,5,6,7],
                        timezone: rel.timezone ? rel.timezone : vm.defaultTimezone,
                        startsOn: rel.startsOn !== undefined && rel.startsOn !== null ? millisToTime(rel.startsOn) : '00:00',
                        endsOn: rel.endsOn !== undefined && rel.endsOn !== null ? millisToTime(rel.endsOn) : '23:59',
                        startsOn1: rel.startsOn1 !== undefined && rel.startsOn1 !== null ? millisToTime(rel.startsOn1) : null,
                        endsOn1: rel.endsOn1 !== undefined && rel.endsOn1 !== null ? millisToTime(rel.endsOn1) : null,
                        percentageChangePlus: rel.percentageChangeIncrease ? rel.percentageChangeIncrease : null,
                        percentageChangeNeg: rel.percentageChangeDecrease ? rel.percentageChangeDecrease : null,
                        delayInMinChg: rel.delayMin ? rel.delayMin : null,
                    }

                    let formValues = {
                        percentageOverThreshold: abs.overThreshold ? abs.overThreshold : null,
                        percentageUnderThreshold: abs.underThreshold ? abs.underThreshold : null,
                        delayInMin: abs.delayMin ? abs.delayMin : null,

                        daysOfWeek: Array.isArray(rel.daysOfWeek) ? rel.daysOfWeek : [1,2,3,4,5,6,7],
                        timezone: rel.timezone ? rel.timezone : vm.defaultTimezone,
                        startsOn: rel.startsOn !== undefined && rel.startsOn !== null ? millisToTime(rel.startsOn) : '00:00',
                        endsOn: rel.endsOn !== undefined && rel.endsOn !== null ? millisToTime(rel.endsOn) : '23:59',
                        startsOn1: rel.startsOn1 !== undefined && rel.startsOn1 !== null ? millisToTime(rel.startsOn1) : null,
                        endsOn1: rel.endsOn1 !== undefined && rel.endsOn1 !== null ? millisToTime(rel.endsOn1) : null,
                        percentageChangePlus: rel.percentageChangeIncrease ? rel.percentageChangeIncrease : null,
                        percentageChangeNeg: rel.percentageChangeDecrease ? rel.percentageChangeDecrease : null,
                        delayInMinChg: rel.delayMin ? rel.delayMin : null,

                        receiveEmail: notif.receiveEmail ?  notif.receiveEmail : false,
                        receiveSms: notif.receiveSms ? notif.receiveSms : false,
                        receiveVoice: notif.receiveVoice ? notif.receiveVoice : false
                    };

                    vm.thresholdFormGroup.patchValue(formValues);

                } catch (error) {
                    console.error("Error parsing attribute JSON:", error);
                }
            },

            function (error) {
                console.error("Error fetching existing values:", error);
            }
        );
    };

    vm.getExistingValue(); 

    vm.cancel = function () {
        vm.dialogRef.close(null);
    };

    vm.save = function () {
        if (vm.thresholdFormGroup.invalid) return;

        // Absolute Level Alert
        let percentageAbsoluteLevelAlert = {
            overThreshold: vm.thresholdFormGroup.get('percentageOverThreshold').value,
            underThreshold: vm.thresholdFormGroup.get('percentageUnderThreshold').value,
            delayMin: vm.thresholdFormGroup.get('delayInMin').value
        };

        // Relative Level Alert
        let percentageRelativeLevelAlert = {
            daysOfWeek: vm.thresholdFormGroup.get('daysOfWeek').value,
            timezone: vm.thresholdFormGroup.get('timezone').value,
            startsOn: timeToMillis(vm.thresholdFormGroup.get('startsOn').value),
            endsOn: timeToMillis(vm.thresholdFormGroup.get('endsOn').value),
            startsOn1: vm.thresholdFormGroup.get('startsOn1').value ? timeToMillis(vm.thresholdFormGroup.get('startsOn1').value) : null,
            endsOn1: vm.thresholdFormGroup.get('endsOn1').value ? timeToMillis(vm.thresholdFormGroup.get('endsOn1').value) : null,
            percentageChangeIncrease: vm.thresholdFormGroup.get('percentageChangePlus').value,
            percentageChangeDecrease: vm.thresholdFormGroup.get('percentageChangeNeg').value,
            delayMin: vm.thresholdFormGroup.get('delayInMinChg').value
        };
        
let fieldsChanged = false;
if (initialRelativeFields !== null) {
    fieldsChanged = haveRelativeFieldsChanged(percentageRelativeLevelAlert, initialRelativeFields);
}

        // Notification Settings
        let percentageAlertNotificationSettings = {
            receiveEmail: vm.thresholdFormGroup.get('receiveEmail').value,
            receiveSms: vm.thresholdFormGroup.get('receiveSms').value,
            receiveVoice: vm.thresholdFormGroup.get('receiveVoice').value
        };

        let attributeData = [
            { key: 'percentageAbsoluteLevelAlert', value: percentageAbsoluteLevelAlert },
            { key: 'percentageRelativeLevelAlert', value: percentageRelativeLevelAlert },
            { key: 'percentageAlertNotificationSettings', value: percentageAlertNotificationSettings }
        ];

        // Save to asset
        attributeService.saveEntityAttributes(entityId, 'SERVER_SCOPE', attributeData).subscribe(
            function () {
                widgetContext.updateAliases();
                vm.dialogRef.close(null);
            },
            function (error) {
                console.error("Error saving thresholds to asset:", error);
            }
        );
    };

    function timeToMillis(time) {
        if (!time || typeof time !== 'string' || !time.includes(':')) {
            return null;
        }

        let [hours, minutes] = time.split(':').map(Number);
        return (hours * 60 + minutes) * 60000;
    }

    function millisToTime(millis) {
        let date = new Date(millis);
        let hours = date.getUTCHours().toString().padStart(2, '0');
        let minutes = date.getUTCMinutes().toString().padStart(2, '0');
        return `${hours}:${minutes}`;
    }
}


function haveRelativeFieldsChanged(current, original) {
    // Compare arrays (daysOfWeek) simply by JSON string for deep equality
    const daysEqual = JSON.stringify(current.daysOfWeek) === JSON.stringify(original.daysOfWeek);
    console.log(current, original)
    return !(
        daysEqual &&
        current.timezone === original.timezone &&
        current.startsOn === original.startsOn &&
        current.endsOn === original.endsOn &&
        current.startsOn1 === original.startsOn1 &&
        current.endsOn1 === original.endsOn1 &&
        current.percentageChangeIncrease == original.percentageChangeIncrease &&
        current.percentageChangeDecrease == original.percentageChangeDecrease &&
        current.delayMin == original.delayMin
    );
}


 