List target_sites = (env.TARGET_SITES == null) ? [] : env.TARGET_SITES.split(';')
List exclude_sites = (env.EXCLUDE_SITES == null) ? [] : env.EXCLUDE_SITES.split(';')

target_sites.removeAll { it in exclude_sites }

Map matrix_axes = [
  SITE: target_sites
]

@NonCPS
List getMatrixAxes(Map matrix_axes) {
  List axes = []
  matrix_axes.each { axis, values ->
    List axisList = []
    values.each { value ->
      axisList << [(axis): value]
    }
    axes << axisList
  }
  axes.combinations()*.sum()
}

List axes = getMatrixAxes(matrix_axes)

Map tasks = [failFast: false]

for(int i = 0; i < axes.size(); i++) {
  Map axis = axes[i]
  List axisEnv = axis.collect { k, v ->
      "${k}=${v}"
  }
  tasks[axisEnv.join(', ')] = { ->
    env.NODEJS_HOME = "${tool 'node'}"
    env.PATH="${env.NODEJS_HOME}/bin:${env.PATH}"

    node {
      skipDefaultCheckout()
      withEnv(axisEnv) {
        try {
          cleanWs()
          checkout scm
          sh 'npm install'
          sh "npm run grab"
        } finally {
          archiveArtifacts artifacts: "guides/**/*.xml", onlyIfSuccessful: true
          cleanWs(
            cleanWhenNotBuilt: false,
            deleteDirs: true,
            disableDeferredWipeout: true,
            notFailBuild: true,
            patterns: [[pattern: '.gitignore', type: 'INCLUDE'],
                       [pattern: '.propsfile', type: 'EXCLUDE']])
        }
      }
    }
  }
}

node {
  stage('Load') {
    parallel(tasks)
  }
}