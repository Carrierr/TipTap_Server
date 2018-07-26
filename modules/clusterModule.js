const moment = require('moment');
const cluster = require('cluster');

const ClusterModule = (function () {
  const localCpus = require('os').cpus().length;
  return {
    run: function(processRun, forkCount) {
      cluster.schedulingPolicy = cluster.SCHED_RR;
      const forks = forkCount || localCpus;
      !!cluster.isMaster ? (() => {
        for (let i = 0; i < forks; i++) {
          cluster.fork();
        };
        cluster.on('exit', (worker) => {
            console.log(util.format('[Logger]::[Cluster]::[Service]::[Worker Died]::[%s]::[WorkerID %d]::[PID %d]',
                                      moment().tz('Asia/Seoul').format('YYYY-MM-DD HH:mm:ss'), worker.id, worker.process.pid));
            if(cluster.fork()) console.log(util.format('[Logger]::[Cluster]::[Service]::[Worker Restart]::[%s]',moment().tz('Asia/Seoul').format('YYYY-MM-DD HH:mm:ss')));
        });
      })() : processRun();
    }
  }
})();

module.exports = ClusterModule;
