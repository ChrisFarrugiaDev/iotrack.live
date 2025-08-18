let $injector = widgetContext.$scope.$injector;
let customDialog = $injector.get(widgetContext.servicesMap.get('customDialog'));
let assetService = $injector.get(widgetContext.servicesMap.get('assetService'));
let attributeService = $injector.get(widgetContext.servicesMap.get('attributeService'));
let entityRelationService = $injector.get(widgetContext.servicesMap.get('entityRelationService'));
let http = widgetContext.http;

openEditAssetDialog();

function openEditAssetDialog() {
    customDialog.customDialog(htmlTemplate, EditAssetDialogController).subscribe();
}

function EditAssetDialogController(instance) {
    instance.vm = instance;
    let vm = instance;
    const dialogs = widgetContext.dialogs;
    vm.asset = null;
    vm.attributes = {};
    vm.devices = [];
    vm.previousLinkedDevice = null;
    vm.previousLinkedSitemap = null;
    vm.siteMapOptions = [];
    vm.groupOptions = [];
    
    vm.notifyValidationConfigs = [];
    
    vm.customerUsers = []; // All users of this customer
    vm.selectedServicingUserId = null;
    vm.selectedCalibrationUserId = null;

    
    // vm.selectedPrimaryGroup = null;
    // vm.selectedSecondaryGroup = null;

    // build form
    vm.editAssetFormGroup = vm.fb.group({
        assetName: ['', [vm.validators.required]],
        assetType: ['', [vm.validators.required]],
        assetLabel: [''],
        linkedDevice: [''],
        linkedSiteMap: [''],
        // selectedPrimaryGroup: [null],  
        // selectedSecondaryGroup: [null],  
        selectedGroups: [[]], // Start with empty array


    
        attributes: vm.fb.group({
            latitude: [null], longitude: [null], address: [null], sitemapCoordinates: [null],
            locationType: [null], powerType: [null], serialNumber: [null], brand: [null], model: [null], year: [null],
            installationDate: [null], lastServiceDate: [null], nextServiceDate: [null], warrantyExpiryDate: [null],
            insuranceDetails: [null], accountNumber: [null], contactPerson: [null], contactEmail: [null],
            contactNumber1: [null], contactNumber2: [null], historyLog: [null],
            asset_Image_1: [null], asset_Image_2: [null], asset_Image_3: [null], asset_Image_4: [null],
            primaryImage: [null], bottom_offset: [null], costPerLiter: [null], fullColour: [null],
            assetShape: [null], cylinderDiameter: [null], cylinderLength: [null], cuboidLength: [null],sensingRange: [null],
            cuboidBreadth: [null], cuboidHeight: [null], chimneyHeight: [null], fluid_converter: [null], pulseRatio: [null], pulseOffset: [null], costPerUnit: [null],
            calibrationDate: [null],serviceDate: [null],serviceFrequency: [null],calibrationFrequency: [null],purchaseDate: [null],costOfAsset: [null],depreciationRate: [null],
            // supervisorName:        [null],
            // supervisorEmail:       ['',[vm.validators.email]],
            // supervisorPhone:       [null],
            // supervisorAltPhone:    [null],
            // supervisorNotify:   [false],
            
            maintenanceName:       [null],
            maintenanceEmail:      ['',[vm.validators.email]],
            maintenancePhone:      [null],
            maintenanceAltPhone:   [null],

            servicingId:           [null],
            servicingName:         [null],
            servicingEmail:        ['',[vm.validators.email]],
            servicingPhone:        [null],
            servicingNotifyEmail:  [false],
            servicingNotifySMS:    [false],
            servicingNotifyWhatsApp:    [false],

            calibrationId:           [null],
            calibrationContactName:  [null],
            calibrationContactEmail: ['',[vm.validators.email]],
            calibrationContactPhone: [null],
            calibrationNotifyEmail:  [false],
            calibrationNotifySMS:    [false],
            calibrationNotifyWhatsApp:    [false],

            
            calibrationCertificatesPDFs: [ [] ],  
            entityGeneralPDFs:           [ [] ],  

            fuelConsumption: [null], 
            batteryVoltage: [null],  
        })
    });
    
    
    setupNotifyValidation();

    vm.imageKeys = ['asset_Image_1', 'asset_Image_2', 'asset_Image_3', 'asset_Image_4'];
    vm.placeholderUrl = 'https://placehold.co/300x300?text=No+Image';

    vm.preventSign = function(event) {
      if (event.key === '-' || event.key === '+') {
        event.preventDefault();
      }
    };
    
    
    vm.onServicingUserSelected = function(userId) {
      const selected = vm.customerUsers.find(u => u.id.id === userId);
      if (selected) {
        const attrGroup = vm.editAssetFormGroup.get('attributes');
    
        attrGroup.patchValue({
          servicingId: userId,
          servicingName: selected.name,
          servicingEmail: selected.email,
          servicingPhone: selected.phone
        });
    
        // Mark dirty
        ['servicingId', 'servicingName', 'servicingEmail', 'servicingPhone'].forEach(key => {
          const control = attrGroup.get(key);
          if (control) {
            control.markAsDirty();
            control.markAsTouched();
            control.updateValueAndValidity();
          }
        });
    
        // ✅ Trigger validation logic again
        const cfg = vm.notifyValidationConfigs.find(c => c.prefix === 'servicing');
        if (cfg) {
          validateNotifyConfig(cfg);
        }
      }
    };

    vm.onCalibrationUserSelected = function(userId) {
      const selected = vm.customerUsers.find(u => u.id.id === userId);
      if (selected) {
        const attrGroup = vm.editAssetFormGroup.get('attributes');
    
        attrGroup.patchValue({
          calibrationId: userId,
          calibrationContactName: selected.name,
          calibrationContactEmail: selected.email,
          calibrationContactPhone: selected.phone
        });
    
        ['calibrationId', 'calibrationContactName', 'calibrationContactEmail', 'calibrationContactPhone'].forEach(key => {
          const control = attrGroup.get(key);
          if (control) {
            control.markAsDirty();
            control.markAsTouched();
            control.updateValueAndValidity();
          }
        });
    
        const cfg = vm.notifyValidationConfigs.find(c => c.prefix === 'calibration');
        if (cfg) {
          validateNotifyConfig(cfg);
        }
      }
    };
    
    function validateNotifyConfig(cfg) {
      // Email toggle
      if (cfg.notifyEmailCtrl.value) {
        cfg.nameCtrl.setValidators([vm.validators.required]);
        cfg.emailCtrl.setValidators([vm.validators.required, vm.validators.email]);
      } else {
        cfg.nameCtrl.clearValidators();
        cfg.emailCtrl.clearValidators();
      }
    
      // SMS toggle
      if (cfg.notifySmsCtrl.value) {
        cfg.nameCtrl.setValidators([vm.validators.required]);
        cfg.phoneCtrl.setValidators([vm.validators.required]);
      } else {
        cfg.phoneCtrl.clearValidators();
      }
      
        // Whats App toggle
      if (cfg.notifyWhatsAppCtrl.value) {
        cfg.nameCtrl.setValidators([vm.validators.required]);
        cfg.phoneCtrl.setValidators([vm.validators.required]);
      } else {
        cfg.phoneCtrl.clearValidators();
      }
    
      cfg.nameCtrl.updateValueAndValidity({ emitEvent: false });
      cfg.emailCtrl.updateValueAndValidity({ emitEvent: false });
      cfg.phoneCtrl.updateValueAndValidity({ emitEvent: false });
    }

    
    
    
    
    function setupNotifyValidation() {
      const attrGroup = vm.editAssetFormGroup.get('attributes');
    
      const configs = [
        {
          prefix: 'servicing',
          nameCtrl:        attrGroup.get('servicingName'),
          emailCtrl:       attrGroup.get('servicingEmail'),
          phoneCtrl:       attrGroup.get('servicingPhone'),
          notifyEmailCtrl: attrGroup.get('servicingNotifyEmail'),
          notifySmsCtrl:   attrGroup.get('servicingNotifySMS'),
          notifyWhatsAppCtrl: attrGroup.get('servicingNotifyWhatsApp'),
        },
        {
          prefix: 'calibration',
          nameCtrl:        attrGroup.get('calibrationContactName'),
          emailCtrl:       attrGroup.get('calibrationContactEmail'),
          phoneCtrl:       attrGroup.get('calibrationContactPhone'),
          notifyEmailCtrl: attrGroup.get('calibrationNotifyEmail'),
          notifySmsCtrl:   attrGroup.get('calibrationNotifySMS'),
          notifyWhatsAppCtrl: attrGroup.get('calibrationNotifyWhatsApp'),
        }
      ];
    
      vm.notifyValidationConfigs = configs; // <-- store globally
    
      configs.forEach(cfg => {
        cfg.notifyEmailCtrl.valueChanges.subscribe(() => validateNotifyConfig(cfg));
        cfg.notifySmsCtrl.valueChanges.subscribe(() => validateNotifyConfig(cfg));
        cfg.notifyWhatsAppCtrl.valueChanges.subscribe(() => validateNotifyConfig(cfg));

      });
    }
        
    
    vm.setPrimaryImage = function (key) {
        const attrGroup = vm.editAssetFormGroup.get('attributes');
        const imageCtrl = attrGroup.get(key);
        const primaryCtrl = attrGroup.get('primaryImage');
    
        if (imageCtrl && imageCtrl.value) {
            primaryCtrl.setValue(imageCtrl.value);
            if (primaryCtrl.value !== vm.attributes.primaryImage) {
                primaryCtrl.markAsDirty();
            }
        }
        console.log('Set primary image from:', key);
        console.log('primaryImage === asset_Image_N:', imageCtrl.value === primaryCtrl.value);

    };


    vm.triggerFileInput = function (inputId) {
        const input = document.getElementById(inputId);
        if (input) input.click();
    };

    vm.onImageChange = function (event, controlName) {
        const file = event.target.files[0];
        if (!file) return;
        compressAndConvertToBase64(file, 500, 500, 0.8)
            .then(base64Image => {
                const control = vm.editAssetFormGroup.get('attributes').get(controlName);
                control.setValue(base64Image);
                control.markAsDirty();
                control.markAsTouched();
                vm.editAssetFormGroup.get('attributes').markAsDirty();
                vm.editAssetFormGroup.markAsDirty();
            })
            .catch(err => console.error('Error processing image:', err));
    };
    
    
    // PDF upload handler
    vm.onPdfSelected = function(event, key) {
      event.stopPropagation();
      // don't preventDefault so file input still works
      const input = /** @type {HTMLInputElement} */(event.target);
      if (!input.files || !input.files.length) return;
      const file = input.files[0];
    
      const timestamp  = Date.now();
      const randomPart = ("" + Math.random()).substr(2,6);
      const fileId     = "file-" + timestamp + "-" + randomPart;
      const fileName   = file.name;
    
      const reader = new FileReader();
      reader.onload = function() {
        const dataUri = reader.result;
        const payload = {
          base64File: dataUri,
          entity_id:  vm.asset.id.id,
          file_id:    fileId,
          type:       vm.asset.type
        };
    
        fetch("https://file.upload.iotsolutions.com.mt/upload", {
          method:  "POST",
          headers: { "Content-Type": "application/json" },
          body:    JSON.stringify(payload)
        })
        .then(function(res) {
          if (!res.ok) {
            return res.text().then(function(text) {
              console.error("❌ [" + key + "] upload error (" + res.status + "):", text);
              throw new Error(text);
            });
          }
          return res.json();
        })
        .then(function(body) {
          const savedUrl = body.url;
          console.log("✅ [" + key + "] uploaded, URL:", savedUrl);
    
          const attrKey = (key === 'calibrationCertificate')
            ? 'calibrationCertificatesPDFs'
            : 'entityGeneralPDFs';
    
          // **pull the control from the nested "attributes" group**
          const attrGroup = vm.editAssetFormGroup.get('attributes');
          const ctrl      = attrGroup.get(attrKey);
    
          // clone the array or start empty
          const existing = Array.isArray(ctrl.value) ? ctrl.value.slice() : [];
          existing.push({ id: fileId, ts: timestamp, url: savedUrl, fileName: fileName });
    
          // update the form so the table refreshes immediately
          ctrl.setValue(existing);
    
          // persist it back to ThingsBoard
          widgetContext.attributeService.saveEntityAttributes(
            { entityType: "ASSET", id: vm.asset.id.id },
            "SERVER_SCOPE",
            [{ key: attrKey, value: existing }]
          ).subscribe(
            function() { console.log("✅ Saved attribute " + attrKey); },
            function(err) { console.error("❌ Error saving " + attrKey, err); }
          );
        })
        .catch(function(err) {
          console.error("Upload workflow failed:", err);
        });
      };
    
      reader.onerror = function(err) {
        console.error("❌ Failed to read PDF:", err);
      };
    
      reader.readAsDataURL(file);
    };

    vm.confirmDelete = function(attrPath, file) {
      dialogs.confirm('Delete PDF', `Are you sure you want to delete “${file.fileName}”?`)
        .subscribe(confirmed => {
          if (!confirmed) return;
    
          // 1️⃣ Build full fileId (including extension)
          const ext = (file.fileName || '').split('.').pop();
          const fullFileId = `${file.id}.${ext}`;
    
          // 2️⃣ Derive "type" segment from the original URL (fallback to vm.asset.type)
          let urlType = vm.asset.type;
          try {
            const parts = file.url.split('/');
            if (parts.length >= 4 && parts[3]) {
              urlType = parts[3];
            }
          } catch (e) {
            console.warn('Could not parse type from URL, using asset.type', e);
          }
    
          // 3️⃣ Build payload
          const deletePayload = {
            entity_id: vm.asset.id.id,
            file_id:   fullFileId,
            type:      urlType
          };
          console.log('Deleting PDF with payload:', deletePayload);
    
          // 4️⃣ Call your DELETE endpoint via POST
          fetch("https://file.upload.iotsolutions.com.mt/di1itFi1xj8BSGx64jGL7yiu0CKNai", {
            method:  "POST",
            headers: { "Content-Type": "application/json" },
            body:    JSON.stringify(deletePayload)
          })
          .then(res => {
            if (!res.ok) {
              return res.text().then(txt => {
                throw new Error(`Server returned ${res.status}: ${txt}`);
              });
            }
            return res.json();
          })
          .then(body => {
            console.log('Delete API response:', body);
    
            // 5️⃣ On success, remove that file from the FormControl array
            const attrGroup = vm.editAssetFormGroup.get('attributes');
            const ctrl      = attrGroup.get(attrPath);
            if (!ctrl) {
              console.error(`Control attributes.${attrPath} not found`);
              return;
            }
            const existing = Array.isArray(ctrl.value) ? [...ctrl.value] : [];
            const updated  = existing.filter(p => p.id !== file.id);
    
            // Patch the control and mark dirty
            ctrl.setValue(updated);
            // ctrl.markAsDirty();
    
            // 6️⃣ Persist the updated array back to TB
            attributeService.saveEntityAttributes(
              { entityType: 'ASSET', id: vm.asset.id.id },
              'SERVER_SCOPE',
              [{ key: attrPath, value: updated }]
            ).subscribe(
              () => {
                console.log(`✅ Removed PDF and updated attribute ${attrPath}`);
                widgetContext.showToast('success', 'File deleted.');
              },
              err => {
                console.error(`❌ Failed saving updated ${attrPath}:`, err);
                widgetContext.showToast('error', `Could not save changes: ${err.message}`);
              }
            );
          })
          .catch(err => {
            console.error('❌ Delete workflow failed:', err);
            widgetContext.showToast('error', `Could not delete file: ${err.message}`);
          });
        });
    };








    function compressAndConvertToBase64(file, maxWidth, maxHeight, quality = 0.8) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            const reader = new FileReader();
            reader.onload = e => img.src = e.target.result;
            img.onload = () => {
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                let width = img.width, height = img.height;
                if (width > maxWidth || height > maxHeight) {
                    const scale = Math.min(maxWidth / width, maxHeight / height);
                    width *= scale; height *= scale;
                }
                canvas.width = width; canvas.height = height;
                ctx.drawImage(img, 0, 0, width, height);
                canvas.toBlob(blob => {
                    const br = new FileReader();
                    br.onloadend = () => resolve(br.result);
                    br.onerror = reject;
                    br.readAsDataURL(blob);
                }, 'image/webp', quality);
            };
            img.onerror = reject;
            reader.readAsDataURL(file);
        });
    }

    vm.editAssetFormGroup.valueChanges.subscribe(() => {
        console.log("Form changed! Valid:", vm.editAssetFormGroup.valid,
                    "Dirty:", vm.editAssetFormGroup.dirty);
    });

    vm.updateShapeFields = function () {
        const shape = vm.editAssetFormGroup.get('attributes.assetShape').value;
        const attrs = vm.editAssetFormGroup.controls.attributes.controls;
        if (shape === 'horizontal-cylinder' || shape === 'vertical-cylinder') {
            attrs.cylinderDiameter.enable(); attrs.cylinderLength.enable();
            attrs.cuboidLength.disable(); attrs.cuboidBreadth.disable(); attrs.cuboidHeight.disable();
        } else if (shape === 'cuboid') {
            attrs.cylinderDiameter.disable(); attrs.cylinderLength.disable();
            attrs.cuboidLength.enable(); attrs.cuboidBreadth.enable(); attrs.cuboidHeight.enable();
        } else {
            attrs.cylinderDiameter.disable(); attrs.cylinderLength.disable();
            attrs.cuboidLength.disable(); attrs.cuboidBreadth.disable(); attrs.cuboidHeight.disable();
        }
    };

    // --- unified load of attributes, relation, then device fetch ---
    getEntityInfoAndDevices();
    
    
function getEntityInfoAndDevices() {
  const id = entityId.id;

  assetService.getAsset(id).subscribe(
    (asset) => {
      vm.asset = asset;
      const customerId = asset.customerId && asset.customerId.id;

    // fetchCustomerUsers(customerId)
    //   .then(users => {
    //     vm.customerUsers = users;
    
    //     // Try to preselect user by matching email
    //     const currentEmail = vm.attributes?.servicingEmail || '';
    //     console.log("currentEmail :"+currentEmail);
        
    //     const matched = users.find(u => u.email === currentEmail);
    //     console.log("matched :"+matched);
        
    //     if (matched) {
    //       vm.selectedServicingUserId = matched.id.id;
    //     }
    //   })
    //   .catch(err => console.error("Error fetching customer users:", err));

    let usersLoaded = fetchCustomerUsers(customerId).then(users => {
      vm.customerUsers = users;
    });



      // 1️⃣ Fetch SiteMaps
      fetchCustomerSiteMaps(customerId)
        .then(siteMaps => {
          vm.siteMapOptions = siteMaps;
          console.log("SiteMap options:", vm.siteMapOptions);
        })
        .catch(err => console.error("Failed to fetch SiteMap assets:", err));




      // 2️⃣ Fetch Customer Groups
      fetchCustomerGroups(customerId)
        .then(groups => {
          vm.groupOptions = groups.filter(g => g.name !== 'All');
          console.log("Group options:", vm.groupOptions);
        })
        .catch(err => console.error("Error fetching customer groups:", err));

      // 3️⃣ Fetch Asset Info → get linkedGroups
      fetchAssetGroups(id)
        .then(groups => {
          vm.linkedGroups = groups;
          console.log("Linked groups:", vm.linkedGroups);
        })
        .catch(err => {
          console.error("Error fetching asset groups:", err);
          vm.linkedGroups = [];
        })
        .finally(() => {
          // 4️⃣ Now load all attributes, including our two new PDF lists
          const keys = [
            "latitude", "longitude", "assetDetails",
            "asset_Image_1", "asset_Image_2", "asset_Image_3", "asset_Image_4",
            "primaryImage",
            "calibrationCertificatesPDFs",
            "entityGeneralPDFs"
          ];
          attributeService.getEntityAttributes(entityId, "SERVER_SCOPE", keys).pipe(
            widgetContext.rxjs.catchError(err => {
              console.error("Attribute lookup failed:", err);
              return widgetContext.rxjs.of([]);  // fallback to empty array
            })
          ).subscribe(attrs => {
            // stash every returned key→value onto vm.attributes
            attrs.forEach(a => vm.attributes[a.key] = a.value);
            // 5️⃣ Fetch relations in parallel
            const deviceRelApi = `/api/relations?fromId=${id}&fromType=ASSET&relationType=Contains&relationTypeGroup=COMMON`;
            const sitemapRelApi = `/api/relations?toId=${id}&toType=ASSET&relationType=Contains&relationTypeGroup=COMMON`;

            widgetContext.rxjs.forkJoin([
              http.get(deviceRelApi),
              http.get(sitemapRelApi)
            ]).subscribe(
              ([deviceRels, sitemapRels]) => {
                vm.previousLinkedDevice = deviceRels.find(r => r.to.entityType === 'DEVICE')?.to.id || null;
                vm.previousLinkedSitemap = sitemapRels.find(r => r.from.entityType === 'ASSET')?.from.id || null;
                patchForm();
                fetchDeviceProfile(asset.type, customerId);
                
                usersLoaded.then(() => {
                  const attrGroup = vm.editAssetFormGroup.get('attributes');
                
                  const servicingId = attrGroup.get('servicingId')?.value;
                  const calibrationId = attrGroup.get('calibrationId')?.value;
                
                  const servicingMatch = vm.customerUsers.find(u => u.id.id === servicingId);
                  const calibrationMatch = vm.customerUsers.find(u => u.id.id === calibrationId);
                
                  vm.selectedServicingUserId = servicingMatch ? servicingMatch.id.id : null;
                  vm.selectedCalibrationUserId = calibrationMatch ? calibrationMatch.id.id : null;
                });
                
              },
              err => {
                console.error("Relation lookup failed:", err);
                patchForm();
                fetchDeviceProfile(asset.type, customerId);
                
                
                usersLoaded.then(() => {
                  const attrGroup = vm.editAssetFormGroup.get('attributes');
                
                  const servicingId = attrGroup.get('servicingId')?.value;
                  const calibrationId = attrGroup.get('calibrationId')?.value;
                
                  const servicingMatch = vm.customerUsers.find(u => u.id.id === servicingId);
                  const calibrationMatch = vm.customerUsers.find(u => u.id.id === calibrationId);
                
                  vm.selectedServicingUserId = servicingMatch ? servicingMatch.id.id : null;
                  vm.selectedCalibrationUserId = calibrationMatch ? calibrationMatch.id.id : null;
                });
                
                
              }
            );
          });
        });
    },
    (err) => {
      console.error("Asset lookup failed:", err);
    }
  );
}




    function patchForm() {
      const a = vm.attributes;
      const details = a.assetDetails || {};
    
      // determine group IDs
        let selectedGroupIds = [];
        if (Array.isArray(vm.linkedGroups)) {
          selectedGroupIds = vm.linkedGroups.map(g => g.id.id).slice(0, 2); // max 2
        }
    
      vm.editAssetFormGroup.patchValue({
        assetName:            vm.asset.name,
        assetType:            vm.asset.type,
        assetLabel:           vm.asset.label,
        linkedDevice:         vm.previousLinkedDevice || '',
        linkedSiteMap:        vm.previousLinkedSitemap || '',
    
        // selectedPrimaryGroup: primaryId,
        // selectedSecondaryGroup: secondaryId,
        selectedGroups: selectedGroupIds,
        
        attributes: {
          latitude:      a.latitude,
          longitude:     a.longitude,
          address:       details.address,
          sitemapCoordinates: details.sitemapCoordinates,
          locationType:  details.locationType,
          powerType:     details.powerType,
          serialNumber:  details.serialNumber,
          brand:         details.brand,
          model:         details.model,
          year:          details.year,
          installationDate:  details.installationDate,
          lastServiceDate:   details.lastServiceDate,
          nextServiceDate:   details.nextServiceDate,
          warrantyExpiryDate: details.warrantyExpiryDate,
          insuranceDetails:  details.insuranceDetails,
          accountNumber:     details.accountNumber,
          contactPerson:     details.contactPerson,
          contactEmail:      details.contactEmail,
          contactNumber1:    details.contactNumber1,
          contactNumber2:    details.contactNumber2,
          historyLog:        details.historyLog,
          asset_Image_1:     a.asset_Image_1,
          asset_Image_2:     a.asset_Image_2,
          asset_Image_3:     a.asset_Image_3,
          asset_Image_4:     a.asset_Image_4,
          calibrationCertificatesPDFs: a.calibrationCertificatesPDFs || [],
          entityGeneralPDFs:           a.entityGeneralPDFs           || [],
          primaryImage:      a.primaryImage,
          bottom_offset:     details.bottom_offset,
          costPerLiter:      details.costPerLiter,
          fullColour:        details.fullColour,
          assetShape:        details.assetShape,
          cylinderDiameter:  details.cylinderDiameter,
          cylinderLength:    details.cylinderLength,
          cuboidLength:      details.cuboidLength,
          cuboidBreadth:     details.cuboidBreadth,
          cuboidHeight:      details.cuboidHeight,
          chimneyHeight:     details.chimneyHeight,
          fluid_converter:   details.fluid_converter,
          sensingRange:      details.sensingRange,
          fuelConsumption: details.fuelConsumption,    // <--- ADD HERE
          batteryVoltage:  details.batteryVoltage,     // <--- ADD HERE
          pulseRatio:        details.pulseRatio,
          pulseOffset:       details.pulseOffset,
          costPerUnit:       details.costPerUnit,
          calibrationDate:       details.calibrationDate,
          serviceDate:           details.serviceDate,
          serviceFrequency:      details.serviceFrequency,
          calibrationFrequency:  details.calibrationFrequency,
          purchaseDate:          details.purchaseDate,
          costOfAsset:           details.costOfAsset,
          depreciationRate:      details.depreciationRate,
    
          maintenanceName:       details.maintenanceName,
          maintenanceEmail:      details.maintenanceEmail,
          maintenancePhone:      details.maintenancePhone,
          maintenanceAltPhone:   details.maintenanceAltPhone,

          servicingId:           details.servicingId,
          servicingName:         details.servicingName,
          servicingEmail:        details.servicingEmail,
          servicingPhone:        details.servicingPhone,
          servicingNotifyEmail:  !!details.servicingNotifyEmail,
          servicingNotifySMS:    !!details.servicingNotifySMS,
          servicingNotifyWhatsApp:    !!details.servicingNotifyWhatsApp,

    
          calibrationId:            details.calibrationId,
          calibrationContactName:   details.calibrationContactName,
          calibrationContactEmail:  details.calibrationContactEmail,
          calibrationContactPhone:  details.calibrationContactPhone,
          calibrationNotifyEmail:   !!details.calibrationNotifyEmail,
          calibrationNotifySMS:     !!details.calibrationNotifySMS,
          calibrationNotifyWhatsApp:     !!details.calibrationNotifyWhatsApp,
        }
      }, { emitEvent: false });
    }
    
    
    
    function fetchDeviceProfile(assetProfile, customerId) {
        const apiUrl = `/api/deviceProfileInfos?pageSize=10&page=0&textSearch=${assetProfile}` +
                       `&sortProperty=name&sortOrder=ASC&transportType=`;
        http.get(apiUrl).subscribe(resp => {
            if (resp.data && resp.data.length) {
                const deviceProfileId = resp.data[0].id.id;
                fetchDevices(deviceProfileId, customerId);
            } else console.warn('No device profiles found for', assetProfile);
        });
    }

    function fetchDevices(deviceProfileId, customerId) {
        const cid = customerId || widgetContext.currentUser.customerId;
        const endpoint = `/api/customer/${cid}/deviceInfos` +
                         `?pageSize=500&page=0&textSearch=&sortProperty=label` +
                         `&sortOrder=ASC&deviceProfileId=${deviceProfileId}`;
        http.get(endpoint).subscribe(res => {
            const list = (res.data || res).map(d => ({ id: d.id.id, name: d.name }));
            filterDevicesWithAssets(list);
        }, err => console.error('[fetchDevices] error', err));
    }
    
    function fetchAssetGroups(assetId) {
        return new Promise((resolve, reject) => {
            const apiUrl = `/api/asset/info/${assetId}`;
            console.log(`[fetchAssetGroups] Fetching from: ${apiUrl}`);
    
            widgetContext.http.get(apiUrl).subscribe(
                (assetInfo) => {
                    console.log("[fetchAssetGroups] assetInfo response:", assetInfo);
                    if (assetInfo && Array.isArray(assetInfo.groups)) {
                        console.log("[fetchAssetGroups] Found groups:", assetInfo.groups);
                        resolve(assetInfo.groups);
                    } else {
                        console.warn("[fetchAssetGroups] No groups found in asset info.");
                        resolve([]);
                    }
                },
                (error) => {
                    console.error("[fetchAssetGroups] HTTP Error:", error);
                    reject(error);
                }
            );
        });
    }
    
    function updateGroups(assetId) {
        // read the new selections
        // const newPrimary = vm.editAssetFormGroup.get('selectedPrimaryGroup').value;
        // const newSecondary = vm.editAssetFormGroup.get('selectedSecondaryGroup').value;
        // previous group IDs from when we loaded the form
        const prevIds = (vm.linkedGroups || []).map(g => g.id.id);
        // desired set (filter out empty string or null)
        // const desired = [newPrimary, newSecondary].filter(id => id);
        const desired = vm.editAssetFormGroup.get('selectedGroups').value || [];

    
        // which to remove, which to add
        const toRemove = prevIds.filter(id => desired.indexOf(id) === -1);
        const toAdd    = desired.filter(id => prevIds.indexOf(id) === -1);
    
        // build HTTP observables
        const calls = [];
        toRemove.forEach(groupId => {
            calls.push(
                http.post(`/api/entityGroup/${groupId}/deleteEntities`, [assetId])
            );
        });
        toAdd.forEach(groupId => {
            calls.push(
                http.post(`/api/entityGroup/${groupId}/addEntities`, [assetId])
            );
        });
    
        // if no changes, return an immediate `of(null)`
        if (calls.length === 0) {
            return widgetContext.rxjs.of(null);
        }
        // wait for all group calls to finish
        return widgetContext.rxjs.forkJoin(calls);
    }
    
    
    
    function fetchCustomerUsers(customerId) {
      const url = `/api/customer/${customerId}/users?pageSize=500&page=0`;
      return new Promise((resolve, reject) => {
        http.get(url).subscribe(
          res => {
            const users = (res.data || []).map(u => ({
              id: u.id,
              name: `${u.firstName} ${u.lastName}`,
              email: u.email,
              phone: u.phone || ''
            }));
            resolve(users);
          },
          err => reject(err)
        );
      });
    }




    
    function fetchCustomerGroups(customerId) {
        const url = `/api/entityGroups/CUSTOMER/${customerId}/ASSET?pageSize=100&page=0`;
        return http.get(url).toPromise().then(res => res.data || []);
    }

    function fetchCustomerSiteMaps(customerId) {
        const apiUrl = `/api/customer/${customerId}/assets?pageSize=100&page=0&type=SiteMap`;
        return http.get(apiUrl).toPromise().then(resp => {
            return (resp.data || []).map(sm => ({ id: sm.id.id, name: sm.name }));
        });
    }

    function filterDevicesWithAssets(devices) {
        let filtered = [], count = 0;
        if (!devices.length) { vm.devices = []; return; }
        devices.forEach(device => {
            entityRelationService.findByToAndType({ entityType: 'DEVICE', id: device.id }, 'Contains')
                .subscribe(rels => {
                    const isOld = vm.previousLinkedDevice === device.id;
                    const hasAsset = rels.some(r => r.from?.entityType === 'ASSET');
                    if (!hasAsset || isOld) filtered.push(device);
                    count++;
                    if (count === devices.length) finalizeFilter(filtered);
                }, () => {
                    count++;
                    if (count === devices.length) finalizeFilter(filtered);
                });
        });
    }

    function finalizeFilter(filtered) {
        if (vm.previousLinkedDevice && !filtered.find(d => d.id === vm.previousLinkedDevice)) {
            http.get(`/api/device/${vm.previousLinkedDevice}`).subscribe(d => {
                filtered.unshift({ id: d.id.id, name: d.name });
                vm.devices = filtered;
            }, () => vm.devices = filtered);
        } else {
            vm.devices = filtered;
        }
    }

    vm.cancel = () => vm.dialogRef.close(null);

    
    vm.save = () => {
        vm.editAssetFormGroup.markAsPristine();
        const newDevId     = vm.editAssetFormGroup.get('linkedDevice').value;
        const newSiteMapId = vm.editAssetFormGroup.get('linkedSiteMap').value;
        // save updated asset name
        vm.asset.name = vm.editAssetFormGroup.get('assetName').value;

    
        // first: persist the asset itself
        assetService.saveAsset(vm.asset).subscribe(saved => {
            const assetId = saved.id.id;
            // next: update group membership
            updateGroups(assetId).subscribe(
                () => {
                    // then update device/sitemap relations
                    updateRelationship(assetId, newDevId, newSiteMapId, () => {
                        // then save attributes
                        saveAttributes().subscribe(() => {
                            widgetContext.updateAliases();
                            vm.dialogRef.close(null);
                        });
                    });
                },
                err => {
                    console.error("❌ Group update failed:", err);
                    widgetContext.showToast('error', 'Failed to update groups');
                    // still attempt to close or decide to leave open
                    vm.dialogRef.close(null);
                }
            );
        }, err => {
            console.error("❌ Asset save failed:", err);
            widgetContext.showToast('error', 'Failed to save asset');
        });
    };



    function saveAttributes() {
        const formGroup = vm.editAssetFormGroup.get('attributes');
        const attrs = formGroup.value;
        const original = vm.attributes;
        const originalDetails = original.assetDetails || {};
    
        // 1️⃣ Standard (scalar) attributes
        const standardAttrs = [];
        ['latitude', 'longitude'].forEach(key => {
            if (attrs[key] !== original[key]) {
                standardAttrs.push({ key, value: attrs[key] });
                console.log(`[standardAttr] Changed: ${key} = ${attrs[key]}`);
            }
        });
    
        // 2️⃣ Image attributes
        const imageAttrs = [];
        ['asset_Image_1', 'asset_Image_2', 'asset_Image_3', 'asset_Image_4', 'primaryImage']
          .forEach(key => {
            if (attrs[key] && attrs[key] !== original[key]) {
                imageAttrs.push({ key, value: attrs[key] });
                console.log(`[imageAttr] Changed: ${key} (base64 length: ${attrs[key].length})`);
            }
        });
    
        // 3️⃣ Deep assetDetails: collect only changed fields
        const changedDetails = {};
        const ignore = new Set([
            'latitude', 'longitude',
            'asset_Image_1', 'asset_Image_2', 'asset_Image_3', 'asset_Image_4', 'primaryImage',
            'calibrationCertificatesPDFs','entityGeneralPDFs'
        ]);
        Object.keys(attrs).forEach(key => {
            if (!ignore.has(key) && attrs[key] !== originalDetails[key]) {
                changedDetails[key] = attrs[key];
                console.log(`[assetDetails] Changed: ${key} = ${attrs[key]}`);
            }
        });
    
        // 4️⃣ Build save calls
        const saveCalls = [];
    
        if (standardAttrs.length) {
            saveCalls.push(
                attributeService.saveEntityAttributes(entityId, 'SERVER_SCOPE', standardAttrs).pipe(
                    widgetContext.rxjs.tap(() => console.log('✅ Standard attrs saved'))
                )
            );
        }
    
        imageAttrs.forEach(attr => {
            saveCalls.push(
                attributeService.saveEntityAttributes(entityId, 'SERVER_SCOPE', [attr]).pipe(
                    widgetContext.rxjs.tap(() => console.log(`✅ Saved image: ${attr.key}`))
                )
            );
        });
    
        // 5️⃣ Merge & save assetDetails if any deep fields changed
        if (Object.keys(changedDetails).length) {
            const mergedDetails = { ...originalDetails, ...changedDetails };
            saveCalls.push(
                attributeService.saveEntityAttributes(entityId, 'SERVER_SCOPE', [
                    { key: 'assetDetails', value: mergedDetails }
                ]).pipe(
                    widgetContext.rxjs.tap(() => console.log('✅ assetDetails saved'))
                )
            );
        }
    
        // 6️⃣ Execute all saves (or no-op)
        return saveCalls.length
            ? widgetContext.rxjs.forkJoin(saveCalls)
            : widgetContext.rxjs.of(null).pipe(widgetContext.rxjs.tap(() => console.log('⚠️ Nothing changed — no attributes saved')));
    }




    function updateRelationship(assetId, newDevId, newSiteMapId, cb) {
        const requests = [];
    
        // DEVICE: ASSET -> DEVICE
        if (vm.previousLinkedDevice && !newDevId) {
            requests.push(http.delete('/api/relation', {
                params: {
                    fromId: assetId, fromType: 'ASSET',
                    relationType: 'Contains', relationTypeGroup: 'COMMON',
                    toId: vm.previousLinkedDevice, toType: 'DEVICE'
                }
            }).pipe(widgetContext.rxjs.tap(() => {
                vm.previousLinkedDevice = null;
            })));
        } else if (newDevId && newDevId !== vm.previousLinkedDevice) {
            requests.push(http.post('/api/relation', {
                from: { id: assetId, entityType: 'ASSET' },
                to: { id: newDevId, entityType: 'DEVICE' },
                type: 'Contains', typeGroup: 'COMMON'
            }).pipe(widgetContext.rxjs.tap(() => {
                vm.previousLinkedDevice = newDevId;
            })));
        }
    
        // SITEMAP: SITEMAP -> ASSET
        if (vm.previousLinkedSitemap && !newSiteMapId) {
            requests.push(http.delete('/api/relation', {
                params: {
                    fromId: vm.previousLinkedSitemap, fromType: 'ASSET',
                    relationType: 'Contains', relationTypeGroup: 'COMMON',
                    toId: assetId, toType: 'ASSET'
                }
            }).pipe(widgetContext.rxjs.tap(() => {
                vm.previousLinkedSitemap = null;
            })));
        } else if (newSiteMapId && newSiteMapId !== vm.previousLinkedSitemap) {
            requests.push(http.post('/api/relation', {
                from: { id: newSiteMapId, entityType: 'ASSET' },
                to: { id: assetId, entityType: 'ASSET' },
                type: 'Contains', typeGroup: 'COMMON'
            }).pipe(widgetContext.rxjs.tap(() => {
                vm.previousLinkedSitemap = newSiteMapId;
            })));
        }
    
        // Execute all operations
        widgetContext.rxjs.forkJoin(requests.length ? requests : [widgetContext.rxjs.of(null)]).subscribe(() => cb());
    }


    function createNewRelationship(assetId, deviceId, cb) {
        const rel = { from: { id: assetId, entityType: 'ASSET' }, to: { id: deviceId, entityType: 'DEVICE' }, type: 'Contains', typeGroup: 'COMMON' };
        http.post('/api/relation', rel).subscribe(() => { vm.previousLinkedDevice = deviceId; cb(); }, e => { console.error(e); cb(); });
    }
}