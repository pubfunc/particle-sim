import { ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, OnDestroy, OnInit, ViewChild, HostListener } from '@angular/core';
import { BehaviorSubject, Subject, timer } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { ParticleParams, Particle } from './particle';
import { Simulation } from './simulation';
import { FormGroup, FormControl } from '@angular/forms';
import { GAMMA } from './const';
import { Starship } from './starship';

const mass_sun = 100000;
const mass_major = 100;
const dist_major = 320;
const dist_minor = 10;
const vel_major = Math.sqrt(GAMMA * mass_sun / dist_major);
const vel_minor = Math.sqrt(GAMMA * mass_major / dist_minor) + vel_major;

const FULL_CIRCLE = Math.PI*2;

const SCENE_2: Readonly<ParticleParams[]> = Object.freeze([

    { label: 'A', x: 0, y: -dist_major, mass: mass_major, vx: vel_major, vy: 0, size: 4 },
    { label: 'A1', x: 0, y: -(dist_minor + dist_major), mass: 1e-10, vx: vel_minor, vy: 0, size: 2 },
    { label: 'B', x: 0, y: dist_major, mass: mass_major, vx: -vel_major, vy: 0, size: 4 },
    { label: 'B1', x: 0, y: (dist_minor + dist_major), mass: 1e-10, vx: -vel_minor, vy: 0, size: 2 },
    { label: 'C', x: 0, y: 200, mass: 1e-20, vx: 40, vy: 0, size: 5 },
    { label: 'M', x: 0, y: 0, mass: mass_sun, vx: 0, vy: 0, size: 20 },
]);


@Component({
    selector: 'pf-simulator',
    templateUrl: 'simulator.component.html',
    styleUrls: ['simulator.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SimulatorComponent implements OnInit, OnDestroy {

    @ViewChild('canvas', {static: true})
    canvasRef: ElementRef<HTMLCanvasElement>;
    private ctx: CanvasRenderingContext2D;

    @ViewChild('backgroundCanvas', {static: true})
    bgCanvasRef: ElementRef<HTMLCanvasElement>;
    private bgCtx: CanvasRenderingContext2D;



    @ViewChild('container', {static: true})
    containerRef: ElementRef<HTMLDivElement>;

    sim = new Simulation();

    paramsFormGroup = new FormGroup({
        gamma: new FormControl(this.sim.gamma),
        softening: new FormControl(this.sim.softening),
        time_step: new FormControl(this.sim.time_step),
    });

    
    draw_velocity = false;
    draw_acceleration = false;
    draw_label = false;

    running = false;
    time: number = 0;
    frames: number = 0;
    fps: number = 0;

    scale = 1;
    
    private dragging = false;
    private drag_origin_x = 0;
    private drag_origin_y = 0;
    private origin_x = 0;
    private origin_y = 0;
    private w = 0;
    private h = 0;

    private _animationFrameRef: number;

    private _destroy$ = new Subject();

    constructor(
        private _hostRef: ElementRef<HTMLElement>,
        private _changeRef: ChangeDetectorRef
    ){}

    ngOnInit(){

        this.ctx = this.canvasRef.nativeElement.getContext('2d');
        this.bgCtx = this.bgCanvasRef.nativeElement.getContext('2d');

        this.bgCtx.globalAlpha = 0.5;


        timer(100, 100)
            .pipe(takeUntil(this._destroy$))
            .subscribe(i => {

                this._changeRef.markForCheck();

            });

        this.reset();
        this.start();
    }

    ngOnDestroy(){

        this._destroy$.next();
        this._destroy$.complete();


    }

    start(){
        this.running = true;
        window.cancelAnimationFrame(this._animationFrameRef);
        this._nextFrame();
        this.centerOrigin();
    }

    stop(){
        this.running = false;
        window.cancelAnimationFrame(this._animationFrameRef);
    }

    toggleStart(){
        this.running ? this.stop() : this.start();
    }

    reset(){
        this.sim.reset();
        const data: ParticleParams[] = JSON.parse(JSON.stringify(SCENE_2));

        data.forEach(p => this.sim.add(p));

        this.bgCtx.clearRect(0,0,this.w, this.h);

    }

    resetAndApplyParams(){
        this.reset();
        this.applyParams();
    }

    applyParams(){

        let form = this.paramsFormGroup.value;
        
        this.sim.time_step = Number(form.time_step);
        this.sim.gamma = Number(form.gamma);
        this.sim.softening  = Number(form.softening);

    }

    private _nextFrame(ts?: number){

        this.frames++;

        if(this.running){
            this.sim.next();
            this.resize();
            this.draw();
    
            this._animationFrameRef = window.requestAnimationFrame((ts: number) => this._nextFrame(ts));
        }

    }

    private resize(){

        const w = this.containerRef.nativeElement.clientWidth;
        const h = this.containerRef.nativeElement.clientHeight;

        if(this.w !== w || this.h !== h){
            this.w = this.canvasRef.nativeElement.width = this.bgCanvasRef.nativeElement.width = w;
            this.h = this.canvasRef.nativeElement.height = this.bgCanvasRef.nativeElement.height = h;
        }

        
    }

    private centerOrigin(){
        this.origin_x = this.w / 2;
        this.origin_y = this.h / 2;
    }

    private draw(){

        
        // draw background
        // this.bgCtx.fillStyle = '#111';
        // this.bgCtx.fillRect(0, 0, this.w, this.h);

        // reset foreground
        this.ctx.fillStyle = '#111';
        this.ctx.clearRect(0, 0, this.w, this.h);

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

        for(let i = 0; i < this.sim.particles.length; i++){
            const pi = this.sim.particles[i];
            this.drawParticle(pi);
            
        }

        // draw ship
        this.drawParticle(this.sim.ship);


        // draw orbits
        this.ctx.strokeStyle = 'rgba(255,255,255,0.5)';
        this.ctx.beginPath();
        this.ctx.arc(this.x(0), this.y(0), this.r(dist_major), 0, FULL_CIRCLE);
        this.ctx.stroke();
        this.ctx.strokeStyle = 'rgba(255,0,0,0.5)';
        this.ctx.beginPath();
        this.ctx.arc(this.x(0), this.y(0), this.r(350), 0, FULL_CIRCLE);
        this.ctx.stroke();

    }

    private drawParticle(pi: Particle){

        // draw particle
        this.ctx.fillStyle = pi.color;
        this.ctx.beginPath();
        this.ctx.arc(this.x(pi.x), this.y(pi.y), this.r(pi.r), 0, FULL_CIRCLE);
        this.ctx.fill();

        // draw particle bg

        this.bgCtx.fillStyle = 'rgba(255,255,255,0.2)';
        this.bgCtx.fillRect(this.x(pi.x), this.y(pi.y), 1, 1);

        this.drawTooltips(pi);
    }

    private drawTooltips(pi: Particle){
        const x = this.x(pi.x);
        const y = this.y(pi.y);

        // draw velocity
        if(this.draw_velocity){
            this.bgCtx.strokeStyle = 'green';
            this.bgCtx.beginPath();
            this.bgCtx.moveTo(x, y);
            this.bgCtx.lineTo(x + this.r(pi.vx), y + this.r(pi.vy));
            this.bgCtx.stroke();
        }

        // draw acc
        if(this.draw_acceleration){
            this.bgCtx.strokeStyle = 'red';
            this.bgCtx.beginPath();
            this.bgCtx.moveTo(x, y);
            this.bgCtx.lineTo(x + (pi.ax * 10), y + (pi.ay * 10));
            this.bgCtx.stroke();
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


    onWheel(event: WheelEvent){
        const delta = Math.sign(event.deltaY);
        this.scale = Math.max(this.scale - (delta * 0.1), 0.01);
    }

    onMouseDown(event: MouseEvent){
        this.dragging = true;
        this.drag_origin_x = event.clientX;
        this.drag_origin_y = event.clientY;
    }

    @HostListener('mouseup', ['$event'])
    onMouseUp(event: MouseEvent){
        this.dragging = false;
    }

    @HostListener('mousemove', ['$event'])
    onMouseMove(event: MouseEvent){

        if(this.dragging){
            this.origin_x += event.movementX;
            this.origin_y += event.movementY;
            // console.log('move', this.origin_x, this.origin_y);
            // this.origin_x = this.origin_x + (event.clientX - this.drag_origin_x);
            // this.origin_y = this.origin_y + (event.clientY - this.drag_origin_y);
            // console.log(this.origin_x, this.origin_y);
            // this.drag_origin_x = event.clientX;
            // this.drag_origin_y = event.clientY;
        }

    }


}