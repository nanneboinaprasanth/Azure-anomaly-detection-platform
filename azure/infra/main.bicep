@description('Azure region for all resources.')
param location string = resourceGroup().location

@description('Short environment name used in resource names.')
@allowed([
  'dev'
  'test'
  'prod'
])
param environment string = 'dev'

@description('Globally unique suffix for resources that require unique names.')
param uniqueSuffix string = uniqueString(resourceGroup().id)

var prefix = 'rt-anomaly-${environment}'
var eventHubNamespaceName = '${prefix}-ehns-${uniqueSuffix}'
var eventHubName = 'transactions'
var storageAccountName = toLower(replace('${prefix}st${uniqueSuffix}', '-', ''))
var functionAppName = '${prefix}-func-${uniqueSuffix}'
var appInsightsName = '${prefix}-appi'
var planName = '${prefix}-plan'
var cosmosAccountName = '${prefix}-cosmos-${uniqueSuffix}'
var databaseName = 'anomalydb'
var containerName = 'alerts'
var streamAnalyticsJobName = '${prefix}-asa'

resource eventHubNamespace 'Microsoft.EventHub/namespaces@2024-01-01' = {
  name: eventHubNamespaceName
  location: location
  sku: {
    name: 'Standard'
    tier: 'Standard'
    capacity: 1
  }
  properties: {
    isAutoInflateEnabled: true
    maximumThroughputUnits: 4
  }
}

resource eventHub 'Microsoft.EventHub/namespaces/eventhubs@2024-01-01' = {
  parent: eventHubNamespace
  name: eventHubName
  properties: {
    partitionCount: 4
    messageRetentionInDays: 1
  }
}

resource storage 'Microsoft.Storage/storageAccounts@2023-05-01' = {
  name: take(storageAccountName, 24)
  location: location
  sku: {
    name: 'Standard_LRS'
  }
  kind: 'StorageV2'
  properties: {
    accessTier: 'Hot'
    minimumTlsVersion: 'TLS1_2'
    allowBlobPublicAccess: false
  }
}

resource appInsights 'Microsoft.Insights/components@2020-02-02' = {
  name: appInsightsName
  location: location
  kind: 'web'
  properties: {
    Application_Type: 'web'
  }
}

resource plan 'Microsoft.Web/serverfarms@2023-12-01' = {
  name: planName
  location: location
  sku: {
    name: 'Y1'
    tier: 'Dynamic'
  }
}

resource functionApp 'Microsoft.Web/sites@2023-12-01' = {
  name: functionAppName
  location: location
  kind: 'functionapp'
  identity: {
    type: 'SystemAssigned'
  }
  properties: {
    serverFarmId: plan.id
    httpsOnly: true
    siteConfig: {
      appSettings: [
        {
          name: 'AzureWebJobsStorage'
          value: 'DefaultEndpointsProtocol=https;AccountName=${storage.name};EndpointSuffix=${environment().suffixes.storage};AccountKey=${storage.listKeys().keys[0].value}'
        }
        {
          name: 'FUNCTIONS_EXTENSION_VERSION'
          value: '~4'
        }
        {
          name: 'FUNCTIONS_WORKER_RUNTIME'
          value: 'java'
        }
        {
          name: 'JAVA_VERSION'
          value: '17'
        }
        {
          name: 'APPINSIGHTS_INSTRUMENTATIONKEY'
          value: appInsights.properties.InstrumentationKey
        }
        {
          name: 'COSMOS_DATABASE'
          value: databaseName
        }
        {
          name: 'COSMOS_CONTAINER'
          value: containerName
        }
      ]
    }
  }
}

resource cosmos 'Microsoft.DocumentDB/databaseAccounts@2024-05-15' = {
  name: cosmosAccountName
  location: location
  kind: 'GlobalDocumentDB'
  properties: {
    databaseAccountOfferType: 'Standard'
    locations: [
      {
        locationName: location
        failoverPriority: 0
        isZoneRedundant: false
      }
    ]
    consistencyPolicy: {
      defaultConsistencyLevel: 'Session'
    }
  }
}

resource cosmosDatabase 'Microsoft.DocumentDB/databaseAccounts/sqlDatabases@2024-05-15' = {
  parent: cosmos
  name: databaseName
  properties: {
    resource: {
      id: databaseName
    }
  }
}

resource alertsContainer 'Microsoft.DocumentDB/databaseAccounts/sqlDatabases/containers@2024-05-15' = {
  parent: cosmosDatabase
  name: containerName
  properties: {
    resource: {
      id: containerName
      partitionKey: {
        paths: [
          '/CardNumber'
        ]
        kind: 'Hash'
      }
    }
  }
}

resource streamAnalyticsJob 'Microsoft.StreamAnalytics/streamingjobs@2021-10-01-preview' = {
  name: streamAnalyticsJobName
  location: location
  properties: {
    sku: {
      name: 'Standard'
    }
    eventsOutOfOrderPolicy: 'Adjust'
    outputErrorPolicy: 'Drop'
    eventsOutOfOrderMaxDelayInSeconds: 5
    eventsLateArrivalMaxDelayInSeconds: 10
    dataLocale: 'en-US'
    compatibilityLevel: '1.2'
  }
}

output eventHubNamespace string = eventHubNamespace.name
output eventHub string = eventHub.name
output streamAnalyticsJob string = streamAnalyticsJob.name
output functionApp string = functionApp.name
output cosmosAccount string = cosmos.name
