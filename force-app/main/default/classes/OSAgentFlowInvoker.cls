public with sharing class OSAgentFlowInvoker {

    public class FlowResponse {
        @AuraEnabled public String sessionId;
        @AuraEnabled public String response;

        public FlowResponse(String sessionId, String response) {
            this.sessionId = sessionId;
            this.response = response;
        }
    }

    /**
     * Invokes an autolaunched flow by API name and returns selected output variables.
     * If no flowApiName is provided, defaults to Invoke_Agentforce_For_Agentic_Next_Best_Actions.
     *
     * @param recordId           Context record Id (may be blank)
     * @param sessionId          Existing session identifier (may be blank)
     * @param requestText        The end-user or agent request text
     * @param osJSON             Current JSON of the Omniscript
     * @param sessionHistoryJSON Optional JSON string of prior messages (ignored by the default flow)
     * @param flowApiName        Optional flow API name to invoke
     * @return FlowResponse containing updated sessionId and the assistant response text
     */
    @AuraEnabled(cacheable=false)
    public static FlowResponse invokeFlow(String recordId, String sessionId, String requestText, String sessionHistoryJSON, String osJSON, String flowApiName) {
        // Prepare the flow input variables, ensuring no nulls are passed.
        Map<String, Object> inputParams = new Map<String, Object>{
            'recordId'   => String.isBlank(recordId)  ? '' : recordId,
            'Session_Id' => String.isBlank(sessionId) ? '' : sessionId,
            'Request'    => String.isBlank(requestText) ? '' : requestText,
            'OmniscriptJSON' => String.isBlank(osJSON) ? '' : osJSON
        };

        // If this appears to be the first turn (no session yet) and we have a request,
        // populate the flow's Initial_Request variable to support alternate flow contracts.
        if (String.isBlank(sessionId) && !String.isBlank(requestText)) {
            inputParams.put('Initial_Request', requestText);
        }

        // Choose flow API name (default to the packaged one)
        String apiNameToInvoke = String.isBlank(flowApiName)
            ? 'Omniscript_Step_Chart_Agent'
            : flowApiName;

        // Create a dynamic interview for the target flow
        Flow.Interview interview = Flow.Interview.createInterview(apiNameToInvoke, inputParams);

        // Execute the flow synchronously.
        interview.start();

        // Collect desired output variables.
        String outSessionId = (String) interview.getVariableValue('Session_Id');
        String outResponse  = (String) interview.getVariableValue('Response');

        return new FlowResponse(outSessionId, outResponse);
    }
}