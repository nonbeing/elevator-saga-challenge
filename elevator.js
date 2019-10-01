{
    init: function(elevators, floors) {
        var elevator = elevators[0]; // Let's use the first elevator
        var NUM_ELEVATORS = elevators.length;
        var NUM_FLOORS = floors.length - 1;

        function remove_duplicates_es6(arr) {
            let s = new Set(arr);
            let it = s.values();
            return Array.from(it);
        }

        function remove_floor(arr, floor) {
            for(var i = arr.length - 1; i >= 0; i--) {
                if(arr[i] === floor) {
                   arr.splice(i, 1);
                }
            }
        }

        function sortDQ(dq, order) {
            // console.log("[sortDQ] Current DQ before sorting in '" + order + "': " + dq);
            if(order == "ascending"){
                dq.sort(function(a, b){return a-b});
            }
            else if (order == "descending") {
                dq.sort(function(a, b){return b-a});
            }
            else {
                console.log("[sortDQ] ERROR IN sortDQ: improper order!");
            }
            // console.log("[sortDQ] DQ after sorting in '" + order + "': " + dq);
            dq = remove_duplicates_es6(dq);
            console.log("[sortDQ] DQ after sorting and de-duplicating: " + dq);
            elevator.destinationQueue = dq;
            elevator.checkDestinationQueue(); // enforce new DQ
            //console.log("[sortDQ] DQ after sorting in '" + order + "': " + elevator.destinationQueue);
        }

        function decideSort() {
            // console.log("destinationDirection: " + elevator.destinationDirection());

            if(elevator.destinationDirection() == "up") {
                console.log("[decideSort] Elevator going up, hence sorting DQ asc");
                sortDQ(elevator.destinationQueue, "ascending");
            }
            else if(elevator.destinationDirection() == "down") {
                console.log("[decideSort] Elevator going down, hence sorting DQ desc");
                sortDQ(elevator.destinationQueue, "descending");
            }
            else if(elevator.destinationDirection() == "stopped") {
                curFloor = elevator.currentFloor();
                if(curFloor > NUM_FLOORS/2) {
                    console.log("[decideSort] Elevator is stopped at: " + curFloor + ". Going DOWN! Sorting DQ desc");
                    sortDQ(elevator.destinationQueue, "descending");
                }
                else {
                    console.log("[decideSort] Elevator is stopped at: " + curFloor + ". Going UP! Sorting DQ asc");
                    sortDQ(elevator.destinationQueue, "ascending");
                }
            }
            else {
                console.error("ERROR: decideSort: destinationDirection invalid");
            }
        }

        floors.forEach(function(floor) {
            //console.log("working on floor: " + floor);
            floor.on("up_button_pressed", function(floor) {
                console.log("[FLOOR_BUTTON] Floor's UP button pressed on floor: " + floor.floorNum());
                if(elevator.loadFactor() > 0.75) {
                    // Ignore impatient floor button presses
                    // since the elevator is near-full, just go on as usual
                    console.log("[FLOOR_BUTTON] Load Factor HIGH! Ignore Floor Request!");
                    // console.log("[FLOOR_BUTTON] DQ: " + elevator.destinationQueue);
                }
                else {
                    elevator.goToFloor(floor.floorNum()); // enqueue the floor
                    // decideSort();
                    elevator.destinationQueue = remove_duplicates_es6(elevator.destinationQueue);
                    console.log("[FLOOR_BUTTON] DQ after de-duplicating: " + elevator.destinationQueue);
                    elevator.checkDestinationQueue(); // enforce new DQ
                }
            });
            floor.on("down_button_pressed", function(floor) {
                console.log("[FLOOR_BUTTON] Floor's DOWN button pressed on floor: " + floor.floorNum());
                if(elevator.loadFactor() > 0.75) {
                    // Ignore impatient floor button presses
                    // since the elevator is near-full, just go on as usual
                    console.log("[FLOOR_BUTTON] Load Factor HIGH! Ignore Floor Request!");
                    // console.log("[FLOOR_BUTTON] DQ: " + elevator.destinationQueue);
                }
                else {
                    elevator.goToFloor(floor.floorNum()); // enqueue the floor
                    // decideSort();
                    elevator.destinationQueue = remove_duplicates_es6(elevator.destinationQueue);
                    console.log("[FLOOR_BUTTON] DQ after de-duplicating: " + elevator.destinationQueue);
                    elevator.checkDestinationQueue(); // enforce new DQ
                }
            });
        });

        // Whenever the elevator is idle (has no more queued destinations) ...
        elevator.on("idle", function() {
            console.log("ELEVATOR IDLE! DQ: " + elevator.destinationQueue);
        });

        elevator.on("floor_button_pressed", function(floorNum) {
            elevator.goToFloor(floorNum);
            decideSort();
            console.log("Elevator Button Pressed: " + floorNum + ". Current DQ: " + elevator.destinationQueue);
        });

        elevator.on("passing_floor", function(floorNum, direction) {
             if(elevator.loadFactor() < 0.7) { // if there's still space in the elevator
                console.log("[PASSING] passing floor: " + floorNum + " with acceptable loadFactor");

                var passing_floor = floors[floorNum];

                if(elevator.destinationQueue.includes(floorNum)) { // if someone's waiting on the passing floor
                    console.log("[PASSING] STOP at passing floor: " + floorNum);
                    elevator.goToFloor(floorNum, true); // Do it before anything else
                    console.log("[PASSING] DQ is now: " + elevator.destinationQueue);
                }
             }
        });

        elevator.on("stopped_at_floor", function(floorNum) {
            // remove all dupes of this floor from the dq
            remove_floor(elevator.destinationQueue, floorNum);
            console.log("[STOPPED] DQ remove all entries of floor '" + floorNum + "' : " + elevator.destinationQueue);
            // this is okay, because even if some people on this floor can't fit in the elevator,
            // they will just keep calling the elevator again and again later, so the floor will get enqueued then
        })
    },
        update: function(dt, elevators, floors) {
            // We normally don't need to do anything here
        }
}