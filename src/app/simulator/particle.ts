
export interface ParticleParams {
    x?: number;
    y?: number;
    vx?: number;
    vy?: number;
    mass?: number;
    size?: number;
    label?: string;
    color?: string;
    trail_length?: number;
}

// See http://physics.princeton.edu/~fpretori/Nbody/code.htm
export class Particle {

    public x: number = 0;
    public y: number = 0;
    public vx: number = 0;
    public vy: number = 0;
    public ax: number = 0;
    public ay: number = 0;
    // public fx: number = 0;
    // public fy: number = 0;
    public mass: number = 1;
    public r: number = 1;
    public label: string;
    public color: string;

    constructor(params: ParticleParams){

        this.x = params.x || 0;
        this.y = params.y || 0;
        this.vx = params.vx || 0;
        this.vy = params.vy || 0;
        this.mass = params.mass || 0;
        this.r = params.size || 4;
        this.label = params.label || 'X';
        this.color = params.color || '#fff';
    }

    /**
     * Update velocity and position for timestep dt
     */
    updateVectors(dt: number){

        // this.ax = this.fx / this.mass;
        // this.ay = this.fy / this.mass;
        this.vx += dt * this.ax;
        this.vy += dt * this.ay;
        this.x += this.vx * dt;
        this.y += this.vy * dt;

    }

    resetForce(){
        this.ax = 0;
        this.ay = 0;
    }

    /**
     * Add to the net force b is acting on a
     */
    addForce(b: Particle, gamma: number, softening: number){
        let a = this;
        const dx = b.x - a.x;
        const dy = b.y - a.y;
        const d = Math.sqrt(dx*dx + dy*dy);
        const ac = (gamma * b.mass) / (d*d + softening);
        a.ax += ac * dx / d;
        a.ay += ac * dy / d;

        // const f = (gamma * b.mass * a.mass) / (d*d + softening);
        // a.fx += f * dx / d;
        // a.fy += f * dy / d;
    }

    acc(){
        return Math.sqrt(this.ax*this.ax + this.ay * this.ay);
    }

    vel(){
        return Math.sqrt(this.vx*this.vx + this.vy * this.vy);
    }

    // for(){
    //     return Math.sqrt(this.fx*this.fx + this.fy * this.fy);
    // }

}