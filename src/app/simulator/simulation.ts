import { Particle, ParticleParams } from './particle';
import { GAMMA, EPS } from './const';
import { Starship } from './starship';


export class SimulationParams {
    gamma: number;
    softening: number;
    time_step: number;
}


export class Simulation {

    public gamma: number = GAMMA;
    public softening: number = EPS;
    public time_step: number = 0.05;

    public bound_left = -1000;
    public bound_right = 1000;
    public bound_top = -1000;
    public bound_bottom = 1000;

    public ship = new Starship({ x: -350, y: 0, mass: 1e-10, size: 5, color: 'red', vy: 35 });
    private particles: Particle[] = [];

    public time: number = 0;


    next(){

        this.time += this.time_step;
        this.updateVectors();
    }

    add(params: ParticleParams){
        this.particles.push(new Particle(params));
    }

    reset(){
        this.particles = [];
        this.time = 0;
    }

    getParticles(){
        return this.particles;
    }

    private updateVectors(){

        // update accelleration, velocity and position
        // bounce particle from boundary
        for(let i = 0; i < this.particles.length; i++){
            const pi = this.particles[i];
            pi.updateVectors(this.time_step);
            // this.bounceBoundary(pi);
        }

        // update force vectors
        for(let i = 0; i < this.particles.length; i++){

            const pi = this.particles[i];
            pi.resetForce();

            for(let j = 0; j < this.particles.length; j++){
                if(i === j) continue;
                const pj = this.particles[j];
                pi.addForce(pj, this.gamma, this.softening);
            }

        }

        for(let i = 0; i < this.particles.length; i++){
            const pi = this.particles[i];
            pi.updateVectors(0);
            // this.bounceBoundary(pi);
        }

        // this.ship.resetForce();

        // for(let j = 0; j < this.particles.length; j++){
        //     const pj = this.particles[j];
        //     this.ship.addForce(pj, this.gamma, this.softening);
        // }




        // this.ship.updateVectors(this.time_step);
        // this.bounceBoundary(this.ship);

    }

    private bounceBoundary(pi: Particle){
        if(pi.x <= this.bound_left && pi.vx < 0){
            pi.vx *= -1;
            pi.x = this.bound_left;
        }

        if(pi.x >= this.bound_right && pi.vx > 0){
            pi.vx *= -1;
            pi.x = this.bound_right;
        }

        if(pi.y <= this.bound_top && pi.vy < 0){
            pi.vy *= -1;
            pi.y = this.bound_top;
        }

        if(pi.y >= this.bound_bottom && pi.vy > 0){
            pi.vy *= -1;
            pi.y = this.bound_bottom;
        }
    }




}