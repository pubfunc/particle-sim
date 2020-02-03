import { ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, HostListener, OnDestroy, OnInit, ViewChild, AfterContentChecked, AfterContentInit } from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';
import { Subject, timer } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { GAMMA } from './const';
import { Particle, ParticleParams } from './particle';
import { Simulation } from './simulation';
import { SimulationView } from './simulation-view';

const mass_sun = 100000;
const mass_major = 100;
const dist_major = 320;
const dist_minor = 10;
const vel_major = Math.sqrt(GAMMA * mass_sun / dist_major);
const vel_minor = Math.sqrt(GAMMA * mass_major / dist_minor) + vel_major;


const SCENE_2: Readonly<ParticleParams[]> = Object.freeze([

    { label: 'A', x: 0, y: -dist_major, mass: mass_major, vx: vel_major, vy: 0, size: 4 },
    { label: 'A1', x: 0, y: -(dist_minor + dist_major), mass: 1e-10, vx: vel_minor, vy: 0, size: 2 },
    { label: 'B', x: 0, y: dist_major, mass: mass_major, vx: -vel_major, vy: 0, size: 4 },
    { label: 'B1', x: 0, y: (dist_minor + dist_major), mass: 1e-10, vx: -vel_minor, vy: 0, size: 2 },
    { label: 'C', x: 0, y: 200, mass: 1, vx: 30, vy: 0, size: 5 },
    { label: 'M', x: 0, y: 0, mass: mass_sun, vx: 0, vy: 0, size: 20 },
]);


@Component({
    selector: 'pf-simulator',
    templateUrl: 'simulator.component.html',
    styleUrls: ['simulator.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    host: {
        class: 'pf-simulator'
    }
})
export class SimulatorComponent implements OnInit, OnDestroy, AfterContentInit {


    @ViewChild('container', {static: true})
    containerRef: ElementRef<HTMLDivElement>;

    sim: Simulation;
    view: SimulationView;

    paramsFormGroup = new FormGroup({
        gamma: new FormControl(),
        softening: new FormControl(),
        time_step: new FormControl(),
    });

    running = false;
    time: number = 0;
    frames: number = 0;
    fps: number = 0;

    private dragging = false;
    private drag_origin_x = 0;
    private drag_origin_y = 0;

    private _animationFrameRef: number;
    private _destroy$ = new Subject();

    constructor(
        private _hostRef: ElementRef<HTMLElement>,
        private _changeRef: ChangeDetectorRef
    ){}

    ngOnInit(){

        this.sim = new Simulation();
        this.view = new SimulationView(this.sim, this.containerRef.nativeElement);

        // timer(100, 100)
        //     .pipe(takeUntil(this._destroy$))
        //     .subscribe(i => {
        //         this._changeRef.markForCheck();
        //     });

        this.reset();
        this.start();
        this._nextFrame();
    }
    
    ngAfterContentInit(){
        this.view.centerOrigin();
    }

    ngOnDestroy(){

        this._destroy$.next();
        this._destroy$.complete();

        window.cancelAnimationFrame(this._animationFrameRef);
    }

    start(){
        this.running = true;
        // window.cancelAnimationFrame(this._animationFrameRef);
        // this._nextFrame();
        // this.centerOrigin();
    }

    stop(){
        this.running = false;
        // window.cancelAnimationFrame(this._animationFrameRef);
    }

    toggleStart(){
        this.running ? this.stop() : this.start();
    }

    reset(){
        this.running = false;
        this.sim.reset();
        const data: ParticleParams[] = JSON.parse(JSON.stringify(SCENE_2));
        data.forEach(p => this.sim.add(p));
        this.running = true;
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
        this.view.draw();

        if(this.running){
            this.sim.next();
        }

        this._animationFrameRef = window.requestAnimationFrame((ts: number) => this._nextFrame(ts));

    }




    onWheel(event: WheelEvent){
        const delta = Math.sign(event.deltaY) * 0.1;
        this.view.zoom(-delta);
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
            this.view.panX(event.movementX);
            this.view.panY(event.movementY);
        }

    }


}