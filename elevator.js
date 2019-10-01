{
    init: function(elevators, floors) {
        // var elevator = elevators[0]; // Let's use the first elevator
        var NUM_ELEVATORS = elevators.length;
        var NUM_FLOORS = floors.length - 1;


        function remove_duplicates_es6(arr) {
            let s = new Set(arr);
            let it = s.values();
            return Array.from(it);
        }


        function remove_floornum_from_dq(arr, floor) {
            for(var i = arr.length - 1; i >= 0; i--) {
                if(arr[i] === floor) {
                   arr.splice(i, 1);
                }
            }
        }


        function sortDQ(elevator, order) {
            var dq = elevator.destinationQueue;
            var elev_index = elevators.indexOf(elevator);

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
            console.log(`[sortDQ] Elev ${elev_index} DQ after '${order}' sort and de-duplicating: ${dq}`);
            elevator.destinationQueue = dq;
            elevator.checkDestinationQueue(); // enforce new DQ
        }


        function newDirectionAfterStopping(elevator) {
            var elev_index = elevators.indexOf(elevator);
            var curFloor = elevator.currentFloor();

            // decide direction based on next floor from the DQ
            // get next floor from the list of pressed floors in the elevator, that is NEAREST to current floor
            pressedFloors = elevator.getPressedFloors();

            if (pressedFloors.length > 0) {
                var closestFloor = pressedFloors.reduce(function(prev, curr) {
                  return (Math.abs(curr - curFloor) < Math.abs(prev - curFloor) ? curr : prev);
                });

                if(closestFloor - curFloor > 0) { // closestFloor is above currentFloor, going UP
                    console.log(`[directionAndSort] Elev ${elev_index} is stopped at ${curFloor}. Going UP to ${closestFloor}`);
                    sortDQ(elevator, "ascending");
                    elevator.goingDownIndicator(false);
                    elevator.goingUpIndicator(true);
                }
                else {
                    console.log(`[directionAndSort] Elev ${elev_index} is stopped at: ${curFloor}. Going DOWN to ${closestFloor}`);
                    sortDQ(elevator, "descending");
                    elevator.goingDownIndicator(true);
                    elevator.goingUpIndicator(false);
                }
            }

            // if there are no pressed floors (no one in elevator), then try to use next elem in DQ to decide direction
            else if (elevator.destinationQueue.length > 0) {
                var nextFloor = elevator.destinationQueue[0];

                if(nextFloor - curFloor > 0) { // nextFloor is above currentFloor, going UP
                    console.log(`[directionAndSort] Elev ${elev_index} is stopped at ${curFloor}. Going UP to ${nextFloor}`);
                    sortDQ(elevator, "ascending");
                    elevator.goingDownIndicator(false);
                    elevator.goingUpIndicator(true);
                }
                else {
                    console.log(`[directionAndSort] Elev ${elev_index} is stopped at: ${curFloor}. Going DOWN to ${nextFloor}`);
                    sortDQ(elevator, "descending");
                    elevator.goingDownIndicator(true);
                    elevator.goingUpIndicator(false);
                }
            }
            else { // can't decide direction? at least set both indicators on, so that the lift is more usable
                elevator.goingDownIndicator(true);
                elevator.goingUpIndicator(true);
            }
        }


        function directionAndSort(elevator) {
            var elev_index = elevators.indexOf(elevator);

            // console.log("destinationDirection: " + elevator.destinationDirection());
            if(elevator.destinationDirection() == "up") {
                console.log(`[directionAndSort] Elev ${elev_index} going up, hence sorting DQ asc`);
                sortDQ(elevator, "ascending");
                elevator.goingDownIndicator(false);
                elevator.goingUpIndicator(true);
            }
            else if(elevator.destinationDirection() == "down") {
                console.log(`[directionAndSort] Elev ${elev_index} going down, hence sorting DQ desc`);
                sortDQ(elevator, "descending");
                elevator.goingDownIndicator(true);
                elevator.goingUpIndicator(false);
            }
            else if(elevator.destinationDirection() == "stopped") {
                newDirectionAfterStopping(elevator);
            }
            else {
                console.error("ERROR: directionAndSort: destinationDirection invalid");
            }
        }


        function getSuitableElevator(floor) {
            // get nearest eligible elevator to the target floor, that also has least load factor
            var eligible_elevs = [];
            var elev_floors = [];

            if(floor) {
                var floor_number = floor.floorNum();
            }
            else {
                console.error("ERROR: invalid floor passed to getSuitableElevator() ???");
            }


             elevators.forEach(function(elevator) {
                if(elevator.loadFactor() < 0.75) {
                    eligible_elevs.push(elevator);
                }
             });

             if (eligible_elevs.length > 0) {

                 eligible_elevs.forEach(function(elevator) {
                    // get elevator floors
                    elev_floors.push(elevator.currentFloor());
                 });
                console.log(`[getSuitableElevator] eligible elevs are on floors: ${elev_floors}`);

                var closestElevFloor = elev_floors.reduce(function(prev, curr) {
                  return (Math.abs(curr - floor_number) < Math.abs(prev - floor_number) ? curr : prev);
                });
                console.log(`[getSuitableElevator] closest suitable elevator to target floor ${floor_number} is on floor: ${closestElevFloor}`);

                var target_elevator_index = elev_floors.indexOf(closestElevFloor);
                console.log(`[getSuitableElevator] target_elevator_index: ${target_elevator_index}`);

                return eligible_elevs[target_elevator_index];
            }
            else {
                console.log(`[getSuitableElevator] Could not find suitable elevator for call on floor ${floor_number}`);
                return null;
            }
        }



        floors.forEach(function(floor) {
            //console.log("working on floor: " + floor);
            floor.on("up_button_pressed", function(floor) {
                console.log(`[FLOOR_BUTTON] Floor ${floor.floorNum()}'s UP button pressed`);

                // pick most suitable elevator to service this request
                elev = getSuitableElevator(floor);
                var chosen_elev_index;

                if(elev) { // if a suitable elev could be found
                    chosen_elev_index = elevators.indexOf(elev);
                    elev.goToFloor(floor.floorNum()); // enqueue the floor
                    elev.destinationQueue = remove_duplicates_es6(elev.destinationQueue);
                    elev.checkDestinationQueue(); // enforce new DQ
                    console.log(`[FLOOR_BUTTON] Elev ${chosen_elev_index} DQ after de-duplicating: ${elev.destinationQueue}`);
                }
                else {
                    // Ignore impatient floor button presses
                    console.log(`[FLOOR_BUTTON] Couldn't find suitable elevator! Ignore Floor ${floor} Request!`);
                }
            });

            floor.on("down_button_pressed", function(floor) {
                console.log(`[FLOOR_BUTTON] Floor ${floor.floorNum()}'s DOWN button pressed`);

                elev = getSuitableElevator(floor);
                var chosen_elev_index;

                if(elev) { // if a suitable elev could be found
                    chosen_elev_index = elevators.indexOf(elev);
                    elev.goToFloor(floor.floorNum()); // enqueue the floor
                    elev.destinationQueue = remove_duplicates_es6(elev.destinationQueue);
                    elev.checkDestinationQueue(); // enforce new DQ
                    console.log(`[FLOOR_BUTTON] Elev ${chosen_elev_index} DQ after de-duplicating: ${elev.destinationQueue}`);
                }
                else {
                    // Ignore impatient floor button presses
                    console.log(`[FLOOR_BUTTON] Couldn't find suitable elevator! Ignore Floor ${floor} Request!`);
                }
            });
        });


        elevators.forEach(function(elevator) { // Setup all elevators
            var this_elev_index = elevators.indexOf(elevator);
            console.log(`Setting up elevator ${this_elev_index} ...`);

           // Whenever the elevator is idle (has no more queued destinations) ...
           elevator.on("idle", function() {
                elevator.goingDownIndicator(true);
                elevator.goingUpIndicator(true);
                console.log(`ELEVATOR ${this_elev_index} IDLE! DQ: ${elevator.destinationQueue}`);
           });

           elevator.on("floor_button_pressed", function(floorNum) {
               // button was pressed INSIDE the elevator, not a "floor button"!!
               elevator.goToFloor(floorNum);
               directionAndSort(elevator);
               console.log(`[ELEV ${this_elev_index} BUTTON]: Floor ${floorNum}. Current DQ: ${elevator.destinationQueue}`);
           });

           elevator.on("passing_floor", function(floorNum, direction) {
                if(elevator.loadFactor() < 0.7) { // if there's still space in the elevator
                   console.log(`[ELEV ${this_elev_index} PASSING] floor: ${floorNum} with ok loadFactor ${elevator.loadFactor()}`);

                   var passing_floor = floors[floorNum];

                   if(elevator.destinationQueue.includes(floorNum)) { // if someone's waiting on the passing floor
                    if(passing_floor)
                       console.log(`[ELEV ${this_elev_index} PASSING] STOP at passing floor: ${floorNum}`);
                       elevator.goToFloor(floorNum, true); // Do it before anything else
                       console.log(`[ELEV ${this_elev_index} PASSING] DQ is now: ${elevator.destinationQueue}`);
                   }
                }
           });

           elevator.on("stopped_at_floor", function(floorNum) {
               // remove all dupes of this floor from the dq
               remove_floornum_from_dq(elevator.destinationQueue, floorNum);
               console.log(`[ELEV ${this_elev_index} STOPPED] removed all entries of floor ${floorNum}. DQ: '${elevator.destinationQueue}'`);
               newDirectionAfterStopping(elevator);
               // this is okay, because even if some people on this floor can't fit in the elevator,
               // they will just keep calling the elevator again and again later, so the floor will get enqueued then
           });
        });


    },
        update: function(dt, elevators, floors) {
            // We normally don't need to do anything here
        }
}