{
    init: function(elevators, floors) {
        var NUM_ELEVATORS = elevators.length;
        var NUM_FLOORS = floors.length - 1;
        var IDLE_ELEVS = [];
        const OK_LOAD_FACTOR = 0.85;


        function dedup(arr) {
            let s = new Set(arr);
            let it = s.values();
            return Array.from(it);
        }


        function remove_item_from_arr(arr, item) {
            for(var i = arr.length - 1; i >= 0; i--) {
                if(arr[i] === item) {
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
            dq = dedup(dq);
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
                    console.log(`[nDAS:Elev${elev_index}] stopped at:${curFloor}. Going UP to pressedFloor:${closestFloor}`);
                    // sortDQ(elevator, "ascending");
                    elevator.goingDownIndicator(false);
                    elevator.goingUpIndicator(true);
                }
                else {
                    console.log(`[nDAS:Elev${elev_index}] stopped at:${curFloor}. Going DOWN to pressedFloor:${closestFloor}`);
                    // sortDQ(elevator, "descending");
                    elevator.goingDownIndicator(true);
                    elevator.goingUpIndicator(false);
                }
            }

            // if there are no pressed floors (no one in elevator), then try to use next elem in DQ to decide direction
            else if (elevator.destinationQueue.length > 0) {
                var nextFloor = elevator.destinationQueue[0];

                if(nextFloor - curFloor > 0) { // nextFloor is above currentFloor, going UP
                    console.log(`[nDAS:Elev${elev_index}] stopped at${curFloor}. Going UP from DQ to:${nextFloor}`);
                    // sortDQ(elevator, "ascending");
                    elevator.goingDownIndicator(false);
                    elevator.goingUpIndicator(true);
                }
                else {
                    console.log(`[nDAS:Elev${elev_index}] stopped at:${curFloor}. Going DOWN from DQ to:${nextFloor}`);
                    // sortDQ(elevator, "descending");
                    elevator.goingDownIndicator(true);
                    elevator.goingUpIndicator(false);
                }
            }
            else { // no pressed floors, no destination queue: go IDLE!
            // can't decide direction? at least set both indicators on, so that the lift is more usable
                console.log(`[nDAS:Elev${elev_index}] Go IDLE and turn BOTH indicators on!`);

                if (!IDLE_ELEVS.includes(elevator)) {
                    IDLE_ELEVS.push(elevator);
                    console.log(`[IDLE_ELEVS] length: ${IDLE_ELEVS.length}`);
                }
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
            var floor_number = floor.floorNum();

            // prioritize idle elevators
            if (IDLE_ELEVS.length > 0) {
                chosen_elevator = IDLE_ELEVS.shift();
                var chosen_elevator_index = elevators.indexOf(chosen_elevator);
                console.log(`[gSE:floor${floor_number}] choosing IDLE elev: ${chosen_elevator_index}`);
                console.log(`[IDLE_ELEVS] length decremented: ${IDLE_ELEVS.length}`);
                return chosen_elevator;
            }

            // get 'eligible' elevators: that have < OK_LOAD_FACTOR
             elevators.forEach(function(elevator) {
                if(elevator.loadFactor() < OK_LOAD_FACTOR) {
                    eligible_elevs.push(elevator);
                }
             });

             if (eligible_elevs.length > 0) {

                 eligible_elevs.forEach(function(elevator) {
                    // get elevator floors
                    elev_floors.push(elevator.currentFloor());
                 });
                console.log(`[gSE:floor${floor_number}] eligible elevs are on floors: ${elev_floors}`);

                var closestElevFloor = elev_floors.reduce(function(prev, curr) {
                  return (Math.abs(curr - floor_number) < Math.abs(prev - floor_number) ? curr : prev);
                });
                var chosen_elevator_index = elev_floors.indexOf(closestElevFloor);
                var chosen_elevator = eligible_elevs[chosen_elevator_index];

                var overall_elev_index = elevators.indexOf(chosen_elevator);
                console.log(`[gSE:floor${floor_number}] closest suitable elevator (${overall_elev_index}) is on floor: ${closestElevFloor}`);

                return chosen_elevator;
            }
            else {
                console.log(`[gSE:floor${floor_number}] [WARN] Could NOT find suitable elevator for floor ${floor_number}`);
                return null;
            }
        }


        floors.forEach(function(floor) {
            //console.log("working on floor: " + floor);
            var floor_num = floor.floorNum();
            floor.on("up_button_pressed", function(floor) {
                console.log(`[FLOOR ${floor_num} BUTTON] UP button pressed`);

                // pick most suitable elevator to service this request
                elev = getSuitableElevator(floor);
                var chosen_elev_index;

                if(elev) { // if a suitable elev could be found
                    chosen_elev_index = elevators.indexOf(elev);
                    elev.goToFloor(floor.floorNum()); // enqueue the floor
                    elev.destinationQueue = dedup(elev.destinationQueue);
                    elev.checkDestinationQueue(); // enforce new DQ
                    console.log(`[FLOOR ${floor_num} BUTTON] Elev ${chosen_elev_index} DQ after dedup: ${elev.destinationQueue}`);
                }
                else {
                    // Ignore impatient floor button presses
                    console.log(`[FLOOR ${floor_num} BUTTON] Couldn't find suitable elevator! IGNORE floor ${floor} request!`);
                }
            });

            floor.on("down_button_pressed", function(floor) {
                console.log(`[FLOOR ${floor_num} BUTTON] DOWN button pressed`);

                elev = getSuitableElevator(floor);
                var chosen_elev_index;

                if(elev) { // if a suitable elev could be found
                    chosen_elev_index = elevators.indexOf(elev);
                    elev.goToFloor(floor.floorNum()); // enqueue the floor
                    elev.destinationQueue = dedup(elev.destinationQueue);
                    elev.checkDestinationQueue(); // enforce new DQ
                    console.log(`[FLOOR ${floor_num} BUTTON] Elev ${chosen_elev_index} DQ after dedup: ${elev.destinationQueue}`);
                }
                else {
                    // Ignore impatient floor button presses
                    console.log(`[FLOOR ${floor_num} BUTTON] Couldn't find suitable elevator! IGNORE floor ${floor} request!`);
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

                if (!IDLE_ELEVS.includes(elevator)) {
                    IDLE_ELEVS.push(elevator);
                }
                console.log(`[ELEV ${this_elev_index}] IDLE! DQ: ${elevator.destinationQueue}`);
                console.log(`[IDLE_ELEVS] length: ${IDLE_ELEVS.length}`);
           });

           elevator.on("floor_button_pressed", function(floorNum) {
               // button was pressed INSIDE the elevator, not a "floor button"!!
               elevator.goToFloor(floorNum);
               directionAndSort(elevator); // this can make an elevator go idle again: darn

               // remove this elevator from IDLE_ELEVS, if present
               remove_item_from_arr(IDLE_ELEVS, elevator);
               console.log(`[ELEV ${this_elev_index} BUTTON]: Pressed floor ${floorNum}. DQ: ${elevator.destinationQueue}`);
               console.log(`[ELEV ${this_elev_index} BUTTON]: removed elev from IDLE_ELEVS, length: ${IDLE_ELEVS.length}`);
           });

           elevator.on("passing_floor", function(floorNum, direction) {
                var passing_floor = floors[floorNum];
                var pressedFloors = elevator.getPressedFloors();

                // if passing by a floor that has been 'pressed', always stop on it
                if(pressedFloors.includes(floorNum)) { // if the passing floor is ON the stop list of "PressedFloors"
                    console.log(`[ELEV ${this_elev_index} PASSING ${floorNum}] STOP at pressed floor: ${floorNum}`);
                    elevator.goToFloor(floorNum, true); // Do it before anything else
                    console.log(`[ELEV ${this_elev_index} PASSING ${floorNum}] DQ is now: ${elevator.destinationQueue}`);
                }

                // decide if we want to pick up additional passengers on a passing floor
                if(elevator.loadFactor() < OK_LOAD_FACTOR) { // if there's still space in the elevator
                   console.log(`[ELEV ${this_elev_index} PASSING ${floorNum}] with ok load and direction '${direction}'`);

                    // if((passing_floor.buttonStates.down == "activated" && direction == "down") ||
                    //     (passing_floor.buttonStates.up == "activated" && direction == "up"))
                    if( (elevator.goingDownIndicator() && passing_floor.buttonStates.down == "activated") ||
                        (elevator.goingUpIndicator() && passing_floor.buttonStates.up == "activated") )
                    {
                       console.log(`[ELEV ${this_elev_index} PASSING ${floorNum}] STOP at DQ floor: ${floorNum}`);
                       elevator.goToFloor(floorNum, true); // Do it before anything else
                       console.log(`[ELEV ${this_elev_index} PASSING ${floorNum}] DQ is now: ${elevator.destinationQueue}`);
                    }
                }
           });

           elevator.on("stopped_at_floor", function(floorNum) {
               // remove all dupes of this floor from the dq
               remove_item_from_arr(elevator.destinationQueue, floorNum);
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