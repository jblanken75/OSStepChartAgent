# Omniscript Step Chart Agent
This project includes a Lightning Web Component that overrides the standard Step Chart element in an Omniscript and replaces it with an Agent.  

## What's included in the Project
- LWC - osStepChartAgent - LWC that overrides the base Step Chart in an Omniscript and shows an Agent
- LWC - osStepChartAgentWithSteps - Same LWC as osStepChart except this LWC inclues the out of the box step chart with a toggle to show the Agent
- Flow - Omniscript_Step_Chart_Agent - Flow that is called from the LWC to interact with an Agent
- Apex - OSAgentFlowInvoker - Apex Class that provides the connection between the LWC and the Flow
- Apex - OSAgentFlowInvoker - Based on current functionality, Experience Cloud users cannot call Invocable Agents directly.  This is expected at some point but this is a workaround that calls the Flow through an API
- Lightning Type - OmniscriptStepChartAgentCalltheOmniscriptAssistantAgent - Used in the Omniscript_Step_Chart_Agent to retrieve responses from the Agent
- Permission Set - OSStepChartAgentPermissions - Grants access to the OSAgentFlowInvoker Apex Class
- genAIPlannerBundle - Omniscript_Assistant - Example Service Agent that is called from the Omniscript_Step_Chart_Agent Flow
- genAIPlugin - Licensing_and_Permitting_Tank_Registration - Example Agent Topic included in the Omniscript_Assistant agent.  
- bot - Omniscript_Assistant - Bot that works in conjunction with the Omniscript_Assistant Agent

## Prerequisites for the Org
- Agentforce must be enabled in the Org
- Licenses for Omnistudio must in the Org
- Omnistudio Metadata must be enabled
- The Omnistudio Managed Package must be enabled in the Org.  Note this is needed even if the Standard runtime and Standard Designers are used.

## Steps to install this in an Org
- Ensure that all prerequisites are in place
- Deploy the components in the following order
    - classes
    - genAiPlugins
    - genAIPlannerBundles
    - bots
    - omniScripts
    - lightningTypes
    - lwc
    - permissionsets
    - You can also use the following command line in terminal replacing: ALIASORLOGIN with your Org's Alias or login:  sf project deploy start --source-dir force-app/main/default/classes force-app/main/default/genAiPlugins force-app/main/default/genAiPlannerBundles force-app/main/default/bots force-app/main/default/omniScripts force-app/main/default/lightningTypes force-app/main/default/lwc force-app/main/default/permissionsets  --target-org ALIASORLOGIN
- In the Org assign an Einstein User to the Omniscript_Assistant Agent and activate the Agent.  
- Deploy the Omniscript_Step_Chart_Agent Flow 
- You can also use the following command line in terminal replacing: ALIASORLOGIN with your Org's Alias or login:  sf project deploy start --source-dir force-app/main/default/flows --target-org ALIASORLOGIN
- Assign the OSStepChartAgentPermissions Permission Set to any users that will use the component

## Current Workaround for Experience Cloud users to use Invocable Agent Actions
As noted in this [Help Article](https://help.salesforce.com/s/articleView?id=ai.agent_custom_invocable_action_flow_apex.htm&type=5), Experience Cloud users cannot directly invoke Invocable Agent Actions.  At some point this is exptected to be supported.  In the meantime this component includes a workaround to call the Flow through a Web Service.  Calling the Web Service requires some additional setup steps found below.  If for whatever reason this component does not need to work with Experience Cloud users then you do not need to perform the following steps.  If you do this then you will need to uncomment this line in the LWC js file:  import invokeFlow from '@salesforce/apex/OSAgentFlowInvoker.invokeFlow'; and comment out this one:  import invokeFlow from '@salesforce/apex/OSAgentFlowInvokerWorkaround.invokeFlow';

Create a Connected App and Named Credential using these steps:
1. Create a Connected App
    1. Go to Setup → External Client Apps → Settings
    2. Ensure that the Allow creation of connected toggle is enabled and Click the New Connected App button
    3. Set the following values:
            1. Name: ConnectAPI
            2. API Name: ConnectAPI
            3. Contact Email: Your email address
            4. Click the Enable OAuth Settings checkbox
            5. Callback URL:  https://login.salesforce.com (Note we will come back and change this value)
            6. Auth Scopes
                1. Select 
                    1. Full access (full) 
                    2. Perform requests at any time (refresh token, offline access)
            7. Click the Enable Client Credentials Flow
                1. Click Ok on the popup window
            8. Click Save and then click Continue
            9. Click the Manage Consumer Detail button
                1. Verify your identity through you email if required
                2. Keep the screen with the Consumer Key and Consumer Secret open


2. Create an Auth Provider
    1. Go to Setup → Auth. Providers
    2. Click the New button
    3. Select Salesforce as the Provider Type
    4. Enter the following values:
        1. Name: ConnectAPI
        2. URL Suffix: ConnectAPI
        3. Consumer Key: Paste from Step 9b above
        4. Consumer Secret:  Paste from Step 9b above
        5. Default Scopes: refresh_token full
        6. Click Save
        7. At the bottom of the screen find the Callback URL value and copy this value
3. Update the Connected App
    1. Go to Setup → App Manager
    2. Find the ConnectAPI Connected app and click the View button on the right hand side of the list
    3. Click the Edit button
    4. Paste in the value from Step 2dvii above into the Callback URL field
    5. Click the Save button and then click the Continue button
4. Wait for 10 minutes to make sure that the Connected App has been updated
5. Create the Named Credential
    1. Go to Setup → Named Credential
    2. Click the dropdown on the New button and select New Legacy
    3. Set the following values:
        1. Label: ConnectAPI
        2. Name: ConnectAPI
            1. Note you can select a different Name for the Named Credential.  If you do then you will need to update the CallExplainerService action of the Get Last Explainer Messages to match the name you select
        3. URL: Your Domain Name followed by my.salesforce.com
            1. Ex:  https://storm-2174aa3fc55207.my.salesforce.com
                1. Note:  There may be issues if your domain name has .demo. in it.  If that’s the case then try adding .demo. before my.salesforce.com
        4. Identity Type:  Named Principal
        5. Authentication Protocol: Oauth 2.0
        6. Authentication Provider:  ConnectAPI
        7. Click Start Authentication Flow on Save
        8. Click Allow Merge Fields in HTTP Header
        9. Click Allow Merge Fields in HTTP Body
    4. Click the Save button
        1. Note if you receive an error message here, wait a few minutes and delete the Named Credential and try again.  Connected Apps can take up to 10 minutes to create
    5. Enter your credentials to the Org
    6. Click the Allow button
    7. Click the Confirm button

## How to add to other Omniscripts
- Open an Omniscript and ensure that the Step Chart is enabled.  
- Go to the Setup tab in the Omniscript.  Find the Element Type to LWC Mapping section.  Add a new entry and set ElementType to StepChart and Lightning Web Component to osStepChartAgent or osStepChartAgentWithSteps
    - Use osStepChartAgentWithSteps if you want to show the steps and osStepChartAgent if you don't want to show the steps
- Create a new topic in the Omniscript_Assistant agent with the same name as the Omnscript.  On the topic add whatever logic, actions, RAG, etc that you need to support the Omniscript.  The example Omniscript just has some basic instructions for a Licensing Scenario.
- Ensure that the Omniscript has descriptive names for elements and not element names like Text1, Radio1, etc.  The more descriptive names will be assist the agent.

## How this component works
The osStepChartAgent overrides the Step Chart component of the Omniscript and replaces it with an Agent conversation.  The LWC has formatting for the sending and receiving of messages to and from the Agent.  When a message is sent from the LWC, the message is routed to the Omniscript Step Chart Agent Flow.  Along with the message, the current state of the Omniscript's JSON.  By sending the current state of the Omniscript's JSON the agent has access to the most up to date and can ground the conversation with the latest details.  

Once in the Flow, the Flow can use the Omniscript JSON to determine which Omniscript is in use.  The Flow then makes a call to the Omniscript Assistant Agent as a headless api call.  When sending the message, the Topic, the message from the end user, and the Omniscript JSON is sent over.  The Agent returns the result to the Flow and the Flow returns the result to the Agent running in the LWC.

## Thoughts for later versions
- More detailed formatting for Mobile browsers
- Ability to update the Omniscript details from the Agent.  This is technically feasible using the omniApplyCallResp method (https://help.salesforce.com/s/articleView?id=xcloud.os_map_responses_to_the_omniscript_s_data_json.htm&type=5).  The response from the flow would just need to send this to the LWC and the LWC would need to call the omniApplyCallResp method.  

