import {Config} from "./../../config/config";
import {CreepActionInterface, CreepAction} from "./creep-action"

export interface HarvesterInterface {

    targetSources(): Source[];
    targetEnergyDropOffs(): (Spawn|StructureController)[];

    isBagFull(): boolean;
    isBagEmpty(): boolean;
    tryHarvest(): number;
    moveToHarvest(): void;
    tryEnergyDropOff(): number;
    moveToDropEnergy(): void;

    action(): boolean;
}

enum Actions {
  Harvset,
  DropOff
}

export class Harvester extends CreepAction implements HarvesterInterface, CreepActionInterface {

  fsm: TypeState.FiniteStateMachine<Actions>;

  public setCreep(creep: Creep) {
    super.setCreep(creep);
  }

  public targetSources(): Source[] {
    return _.map(this.creep.memory.target_source_ids, <(string) => Source>Game.getObjectById)
  }

  public targetEnergyDropOffs(): (Spawn|StructureController)[] {
    return _.map(this.creep.memory.target_energy_dropoff_ids, <(string) => Spawn|StructureController>Game.getObjectById)
  }

  public targetSource(): Source {
    return this.targetSources().filter( source => source.energy > 0)[0];
  }

  public targetEnergyDropOff(): Spawn|StructureController {
    return this.targetEnergyDropOffs().filter( dest => {
      if ( dest.structureType == STRUCTURE_SPAWN ) {
        return (<Spawn>dest).energy < (<Spawn>dest).energyCapacity
      } else if ( dest.structureType == STRUCTURE_CONTROLLER) {
        return true;
      }
    })[0];
  }

  public isBagFull(): boolean {
    return (this.creep.carry.energy == this.creep.carryCapacity);
  }

  public isBagEmpty(): boolean {
    return (this.creep.carry.energy == 0);
  }

  public tryHarvest(): number {
    let source = this.targetSource()
    console.log("source:" + source.id);
    return this.creep.harvest(this.targetSource());
  }

  public moveToHarvest(): void {
    if (this.tryHarvest() == ERR_NOT_IN_RANGE) {
      this.moveTo(this.targetSource());
    }
  }

  public tryEnergyDropOff(): number {
    let target = this.targetEnergyDropOff()
    console.log("target:"+target);
    if (target.structureType == STRUCTURE_CONTROLLER) {
      console.log("Upgrading controller:"+target);
      return this.creep.upgradeController(<StructureController>target);
    }
    console.log("Storing energy:"+target);
    return this.creep.transfer(this.targetEnergyDropOff(), RESOURCE_ENERGY);
  }

  public moveToDropEnergy(): void {
    if (this.tryEnergyDropOff() == ERR_NOT_IN_RANGE) {
      console.log("Moving to: "+this.targetEnergyDropOff());
      this.moveTo(this.targetEnergyDropOff());
    }
  }

  public action(): boolean {
    if (this.needsRenew()) {
      this.moveToRenew();
    } else if (!this.isBagEmpty()) {
      this.moveToDropEnergy();
    } else {
      this.moveToHarvest();
    }

    return true
  }

}
