OK 1. Change registered_at column to created_at

OK 2. In organisations table: add attributes field, remove description

OK 3. In asset table: add attributes field, remove description



5. Start working on the homepage and add Google Maps integration

OK 6. Dockerize the teltonika.parser.go service

OK 7. Impliment latest telemetry on the devices

8. In go teltonika parser update the :
    'LastTelemetryMap    map[string]apptypes.FlatAvlRecord'
    from redis at start up

<!-- =============================================================== -->

In Vmodal set title as named slot as footer.


web.backend.node.ts: 
    1. add assertion for exchange and routing key, 
    2. start implementing last telemetry logic.
    3. in authmiddleware add token version check.
    4. start warking on the device api crud.
    5. When Login in api auth use zod not expres-validation
    6. Put Zod validation as middleware

web.frontend.vue:
    1 Device list:
        a. add delete functionality
        b. add filter by group
        c. add filter by organisation
    2 Register new Device:
        a. add organisation and attach to asset fields.
        b. add iccid and phone number field
        b. add qr code and barcode scan
        b. add buttons with confirmation.

    





