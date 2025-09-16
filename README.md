# Omniscript Step Chart Agent
This project includes a Lightning Web Component that overrides the standard Step Chart element in an Omniscript and replaces it with an Agent.  

## What's included in the Project
- LWC - osStepChartAgent - LWC that overrides the base Step Chart in an Omniscript and shows an Agent
- Flow - Omniscript_Step_Chart_Agent - Flow that is called from the LWC to interact with an Agent
- Apex - OSAgentFlowInvoker - Apex Class that provides the connection between the LWC and the Flow
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
- Ensure that all requisites are in place
- Deploy the components in the following order
-- classes
-- genAiPlugins
-- genAIPlannerBundles
-- bots
-- omniScripts
-- lightningTypes
-- lwc
-- permissionsets
-- You can also use the following command line in terminal replacing: ALIASORLOGIN with your Org's Alias or login:  sf project deploy start --source-dir force-app/main/default/classes force-app/main/default/genAiPlugins force-app/main/default/genAiPlannerBundles force-app/main/default/bots force-app/main/default/omniScripts force-app/main/default/lightningTypes force-app/main/default/lwc force-app/main/default/permissionsets  --target-org ALIASORLOGIN
- In the Org assign an Einstein User to the Omniscript_Assistant Agent and activate the Agent.  
- Deploy the Omniscript_Step_Chart_Agent Flow 
- You can also use the following command line in terminal replacing: ALIASORLOGIN with your Org's Alias or login:  sf project deploy start --source-dir force-app/main/default/flows --target-org ALIASORLOGIN

## How to add to other Omniscripts
- Open an Omniscript and ensure that the Step Chart is enabled.  
- Go to the Setup tab in the Omniscript.  Find the Element Type to LWC Mapping section.  Add a new entry and set ElementType to StepChart and Lightning Web Component to Lightning Web Component
- Create a new topic in the Omniscript_Assistant agent with the same name as the Omnscript.  On the topic add whatever logic, actions, RAG, etc that you need to support the Omniscript.  The example Omniscript just has some basic instructions for a Licensing Scenario.
- Ensure that the Omniscript has descriptive names for elements and not element names like Text1, Radio1, etc.  The more descriptive names will be assist the agent.

## How this component works
The osStepChartAgent overrides the Step Chart component of the Omniscript and replaces it with an Agent conversation.  The LWC has formatting for the sending and receiving of messages to and from the Agent.  When a message is sent from the LWC, the message is routed to the Omniscript Step Chart Agent Flow.  Along with the message, the current state of the Omniscript's JSON.  By sending the current state of the Omniscript's JSON the agent has access to the most up to date and can ground the conversation with the latest details.  

Once in the Flow, the Flow can use the Omniscript JSON to determine which Omniscript is in use.  The Flow then makes a call to the Omniscript Assistant Agent as a headless api call.  When sending the message, the Topic, the message from the end user, and the Omniscript JSON is sent over.  The Agent returns the result to the Flow and the Flow returns the result to the Agent running in the LWC.

## Thoughts for later versions
- Incorporate the Out of the box Step chart with the LWC.  Currently the LWC replaces the Step Chart entirely
- More detailed formatting for Mobile browsers
- Ability to update the Omniscript details from the Agent.  This is technically feasible using the omniApplyCallResp method (https://help.salesforce.com/s/articleView?id=xcloud.os_map_responses_to_the_omniscript_s_data_json.htm&type=5).  The response from the flow would just need to send this to the LWC and the LWC would need to call the omniApplyCallResp method.  

