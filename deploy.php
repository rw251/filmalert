<?php
namespace Deployer;

require 'recipe/common.php';

// Project name
set('application', 'FilmAlert');

// Project repository
set('repository', 'git@github.com:rw251/filmalert.git');

// [Optional] Allocate tty for git clone. Default value is false.
set('git_tty', false); 

// Shared files/dirs between deploys 
set('shared_files', []);
set('shared_dirs', []);

// Writable dirs by web server 
set('writable_dirs', []);


// Hosts

host('filmalert.cf')
    ->set('deploy_path', '~/app');    
    

// Tasks

desc('Deploy your project');
task('deploy', [
    'deploy:info',
    'deploy:prepare',
    'deploy:lock',
    'deploy:release',
    'deploy:update_code',
    'deploy:shared',
    'deploy:writable',
    'deploy:vendors',
    'deploy:clear_paths',
    'deploy:symlink',
    'deploy:unlock',
    'cleanup',
    'success'
]);


task('deploy:staging', function() {
    writeln('<info>Deploying...</info>');
    $appFiles = [
        'dist',
    ];
    $deployPath = get('deploy_path');

    foreach ($appFiles as $file)
    {
        upload($file, "{$deployPath}/{$file}");
    }

    writeln('<info>Deployment is done.</info>');
});

task('test', function () {
    writeln('Hello world');
});

// [Optional] If deploy fails automatically unlock.
after('deploy:failed', 'deploy:unlock');
