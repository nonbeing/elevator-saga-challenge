{
    init: function(elevators, floors) {
        var elevator = elevators[0]; // Let's use the first elevator
        var NUM_ELEVATORS = elevators.length;
        var NUM_FLOORS = floors.length - 1;

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
            console.log("[sortDQ] DQ after sorting in '" + order + "': " + dq);
            elevator.destinationQueue = dq;
            elevator.checkDestinationQueue(); // enforce new DQ
            //console.log("[sortDQ] Elevator DQ after sorting in '" + order + "': " + elevator.destinationQueue);
        }

        function decideSort() {
            // console.log("destinationDirection: " + elevator.destinationDirection());

            if(elevator.destinationDirection() == "up") {
                console.log("[decideSort] Elevator going UP! Sorting DQ asc");
                sortDQ(elevator.destinationQueue, "ascending");
            }
            else if(elevator.destinationDirection() == "down") {
                console.log("[decideSort] Elevator going DOWN! Sorting DQ desc");
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
                console.log("Floor's UP button pressed on floor: " + floor.floorNum());
                if(elevator.loadFactor() > 0.75) {
                    // Ignore impatient floor button presses
                    // since the elevator is near-full, just go on as usual
                    console.log("Load Factor > 0.8! Ignore Floor Request!");
                    console.log("Elevator DQ: " + elevator.destinationQueue);
                }
                else {
                    elevator.goToFloor(floor.floorNum()); // enqueue the floor
                    // decideSort();
                    console.log("Elevator DQ: " + elevator.destinationQueue);
                }
            });
            floor.on("down_button_pressed", function(floor) {
                console.log("Floor's DOWN button pressed on floor: " + floor.floorNum());
                if(elevator.loadFactor() > 0.75) {
                    // Ignore impatient floor button presses
                    // since the elevator is near-full, just go on as usual
                    console.log("Load Factor > 0.8! Ignore Floor Request!");
                    console.log("Elevator DQ: " + elevator.destinationQueue);
                }
                else {
                    elevator.goToFloor(floor.floorNum()); // enqueue the floor
                    // decideSort();
                    console.log("Elevator DQ: " + elevator.destinationQueue);
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
    },
        update: function(dt, elevators, floors) {
            // We normally don't need to do anything here
        }
}