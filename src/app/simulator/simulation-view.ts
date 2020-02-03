import { Simulation } from './simulation';
import { Particle } from './particle';
import { THIS_EXPR } from '@angular/compiler/src/output/output_ast';

const FULL_CIRCLE = Math.PI*2;


export class SimulationView {

    canvas: HTMLCanvasElement;
    bgCanvas: HTMLCanvasElement;

    ctx: CanvasRenderingContext2D;
    bgCtx: CanvasRenderingContext2D;

    draw_velocity = false;
    draw_acceleration = false;
    draw_label = false;

    sim: Simulation;
    origin_x = 0;
    origin_y = 0;
    w = 0;
    h = 0;
    scale = 1;

    constructor(simulation: Simulation,private container: HTMLElement){

        this.sim = simulation;
        this.canvas = document.createElement('canvas');
        this.bgCanvas = document.createElement('canvas');

        this.canvas.width = this.bgCanvas.width = 100;
        this.canvas.height = this.bgCanvas.height = 100;


        this.ctx = this.canvas.getContext('2d');
        this.bgCtx = this.bgCanvas.getContext('2d');

        container.appendChild(this.canvas);
        // container.appendChild(this.bgCanvas);

    }

    resize(){

        const w = this.container.clientWidth;
        const h = this.container.clientHeight;

        if(this.w !== w || this.h !== h){
            this.w = this.canvas.width = this.bgCanvas.width = w;
            this.h = this.canvas.height = this.bgCanvas.height = h;
        }

        
    }

    centerOrigin(){
        this.origin_x = this.w / 2;
        this.origin_y = this.h / 2;
    }

    panX(amount: number){
        this.origin_x += amount;
    }

    panY(amount: number){
        this.origin_y += amount;
    }

    zoom(amount: number){
        this.scale = Math.max(this.scale + amount, 0.01);
    }

    draw(){

        this.resize();

        // draw background
        // this.bgCtx.fillStyle = '#111';
        // this.bgCtx.fillRect(0, 0, this.w, this.h);

        // reset foreground
        this.ctx.fillStyle = '#111';
        this.ctx.clearRect(0, 0, this.w, this.h);



        const particles = this.sim.getParticles();

        for(let i = 0; i < particles.length; i++){
            this.drawParticle(particles[i]);
        }

        for(let i = 0; i < particles.length; i++){
            this.drawTooltips(particles[i]);
        }

        // draw ship
        this.drawParticle(this.sim.ship);


        // draw orbits
        // this.ctx.strokeStyle = 'rgba(255,255,255,0.5)';
        // this.ctx.beginPath();
        // this.ctx.arc(this.x(0), this.y(0), this.r(dist_major), 0, FULL_CIRCLE);
        // this.ctx.stroke();
        // this.ctx.strokeStyle = 'rgba(255,0,0,0.5)';
        // this.ctx.beginPath();
        // this.ctx.arc(this.x(0), this.y(0), this.r(350), 0, FULL_CIRCLE);
        // this.ctx.stroke();


        // draw circular grid
        this.ctx.strokeStyle = 'grey';
        this.ctx.beginPath();
        this.ctx.moveTo(this.origin_x, this.origin_y - 10);
        this.ctx.lineTo(this.origin_x, this.origin_y + 10);
        this.ctx.moveTo(this.origin_x - 10, this.origin_y);
        this.ctx.lineTo(this.origin_x + 10, this.origin_y);
        this.ctx.stroke();

        // draw origin
        this.ctx.strokeStyle = 'grey';
        this.ctx.beginPath();
        this.ctx.moveTo(this.origin_x, this.origin_y - 10);
        this.ctx.lineTo(this.origin_x, this.origin_y + 10);
        this.ctx.moveTo(this.origin_x - 10, this.origin_y);
        this.ctx.lineTo(this.origin_x + 10, this.origin_y);
        this.ctx.stroke();

        // draw boundary
        this.ctx.strokeStyle = 'grey';
        this.ctx.beginPath();
        this.ctx.moveTo(this.x(this.sim.bound_left),  this.y(this.sim.bound_top));
        this.ctx.lineTo(this.x(this.sim.bound_right), this.y(this.sim.bound_top));
        this.ctx.lineTo(this.x(this.sim.bound_right), this.y(this.sim.bound_bottom));
        this.ctx.lineTo(this.x(this.sim.bound_left),  this.y(this.sim.bound_bottom));
        this.ctx.lineTo(this.x(this.sim.bound_left),  this.y(this.sim.bound_top));
        this.ctx.stroke();


        this.ctx.drawImage(this.bgCanvas, 0, 0);
    }

    private drawParticle(pi: Particle){

        const x = this.x(pi.x);
        const y = this.y(pi.y);
        const r = this.r(pi.r);

        const gradient = this.ctx.createRadialGradient(x,y,0, x, y, r);
        gradient.addColorStop(0.3, pi.color);
        gradient.addColorStop(0.98, 'transparent');

        // draw particle
        this.ctx.fillStyle = gradient;
        this.ctx.strokeStyle = 'rgba(255,255,255,0.1)';
        this.ctx.beginPath();
        this.ctx.arc(x, y, r, 0, FULL_CIRCLE);
        this.ctx.fill();
        this.ctx.stroke();

        // draw particle bg
        this.bgCtx.fillStyle = 'rgba(255,255,255,0.2)';
        this.bgCtx.fillRect(this.x(pi.x), this.y(pi.y), 1, 1);

    }

    private drawTooltips(pi: Particle){
        const x = this.x(pi.x);
        const y = this.y(pi.y);

        // draw velocity
        if(this.draw_velocity){
            this.ctx.strokeStyle = 'green';
            this.ctx.beginPath();
            this.ctx.moveTo(x, y);
            this.ctx.lineTo(x + this.r(pi.vx), y + this.r(pi.vy));
            this.ctx.stroke();
        }

        // draw acc
        if(this.draw_acceleration){
            this.ctx.strokeStyle = 'red';
            this.ctx.beginPath();
            this.ctx.moveTo(x, y);
            this.ctx.lineTo(x + this.r(pi.ax), y + this.r(pi.ay));
            this.ctx.stroke();
            // this.ctx.strokeStyle = 'blue';
            // this.ctx.beginPath();
            // this.ctx.moveTo(x, y);
            // this.ctx.lineTo(x + this.r(pi.fx), y + this.r(pi.fy));
            // this.ctx.stroke();
        }

        // draw tooltips
        if(this.draw_label){
            this.ctx.fillStyle = 'green';
            this.ctx.fillText(`${pi.label} ${Math.round(pi.x)},${Math.round(pi.y)}`, x + 15, y + 15);
        }

    }

    private x(sim_x: number){
        return this.origin_x + (sim_x * this.scale);
    }

    private y(sim_y: number){
        return this.origin_y + (sim_y * this.scale);
    }

    private r(sim_r: number){
        return sim_r * this.scale;
    }

}