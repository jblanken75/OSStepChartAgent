import { LightningElement, api, track, wire } from 'lwc';
import { subscribe, unsubscribe, APPLICATION_SCOPE, MessageContext } from 'lightning/messageService';
//import invokeFlow from '@salesforce/apex/OSAgentFlowInvoker.invokeFlow';
import invokeFlow from '@salesforce/apex/OSAgentFlowInvokerWorkaround.invokeFlow';
import { OmniscriptBaseMixin } from "omnistudio/omniscriptBaseMixin";

import omniscriptStepChart from 'omnistudio/omniscriptStepChart';
import tmpl from './osStepChartAgent.html';

const ROLE_USER = 'user';
const ROLE_ASSISTANT = 'assistant';

// Add constant for display sender roles
const DISPLAY_SENDER = { USER_INPUT: 'UserInput', ASSISTANT: 'Assistant', SYSTEM: 'SystemMessage' };

export default class OsStepChartAgent extends OmniscriptBaseMixin(omniscriptStepChart) {
    @api recordId;
    @api initialRequest='';
    @api containerHeight = 350;
    @api sendEndUserConversation = false;
    @api sendAgentConversation = false;

    // New: configurable Flow API Name; default is also set in metadata
    @api flowApiName = '';;

    @track messages = [];
    @track chatInput = '';
    @track isThinking = false;
    @track activeFlowApiName = null;
    @track flowInputVariables = [];
    @track _showInputBox = false;

    _sessionId = '';
    _isInitiallyLoading = false;

    @wire(MessageContext) messageContext;

   // userLmsSubscription;
   // agentLmsSubscription;

    connectedCallback() {
        
        this.initialRequest = 'Initial';
        if (this.initialRequest && this.initialRequest.trim() !== '') {
            // Fire the very first request automatically
            this._isInitiallyLoading = true;
            this._sendRequestToFlow(this.initialRequest.trim());
        }

        // Detect channel context based on record Id prefix
       // if (this.recordId) {
       //     const prefix = this.recordId.substring(0, 3).toLowerCase();
       //     if (prefix === '0mw') {
       //         this._subscribeToMessageChannels();
       //     }
            // Voice Call record prefix handling (0LQ)
            // No subscription needed; Voice Toolkit API events are wired in the template
       // }
    }

    disconnectedCallback() {
      //  this._unsubscribeFromMessageChannels();
    }

    /* =============================================================
     * UI helpers
     * =========================================================== */
    /* =============================================================
     * Simple Markdown → HTML (links + bold)
     * =========================================================== */
    customMarkdownToHtml(text) {
        if (!text || typeof text !== 'string') return text;
        let html = text;
        html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
        html = html.replace(/\[([^\]]+?)\]\(([^)]+?)\)/g, '<a href="$2" target="_blank">$1</a>');
        return html;
    }

    /* =============================================================
     * Rich-format mapping for v3 UI
     * =========================================================== */
    get formattedMessages() {
        const assistantMessages = this.messages.filter(m => m.role === ROLE_ASSISTANT);
        const latestAssistantMessageId = assistantMessages.length > 0 ? assistantMessages[assistantMessages.length - 1].id : null;

        return (this.messages || []).map(original => {
            const isUser = original.role === ROLE_USER;
            const isLatestAssistant = original.id === latestAssistantMessageId;
            const sender = isUser ? DISPLAY_SENDER.USER_INPUT : DISPLAY_SENDER.ASSISTANT;
            const listItemClassV3 = `v3-chat-list-item ${isUser ? 'user' : 'assistant'}`;
            const bubbleClassV3 = `v3-message-bubble ${isUser ? 'user' : 'assistant'} ${!isUser && !isLatestAssistant ? 'previous-assistant' : ''}`;
            
            let conciseText, fullText, hasFullContent, suggestedAgentActions, suggestedUserActions, executedAgentActions;

            if (original.payload) {
                // Assistant message with rich payload
                conciseText = this.customMarkdownToHtml(original.payload.conciseResponse);
                fullText = this.customMarkdownToHtml(original.payload.fullResponse);
                hasFullContent = !!fullText;

                // Dynamically set button variants based on whether the message is the latest
                const buttonVariant = isLatestAssistant ? 'brand' : 'neutral';
                
                suggestedAgentActions = (original.payload.suggestedAgentActions || []).map(a => ({ ...a, variant: buttonVariant }));
                suggestedUserActions = (original.payload.suggestedUserActions || []).map(a => ({ ...a, variant: buttonVariant }));
                executedAgentActions = original.payload.executedAgentActions;
            } else {
                // Standard user or text-only message
                conciseText = this.customMarkdownToHtml(original.text);
                fullText = null;
                hasFullContent = false;
                }

            const isExpanded = original.isExpandedForView || false;
            return {
                id: original.id,
                conciseText,
                fullText,
                hasFullContent,
                listItemClassV3,
                messageRowClassV3: 'v3-message-row',
                bubbleClassV3,
                metaClassV3: 'v3-message-meta',
                bubbleStyleV3: '',
                showAvatar: !isUser,
                avatarSrc: null,
                avatarIcon: isUser ? 'utility:user' : 'utility:bot',
                avatarInitials: isUser ? 'U' : '',
                senderLabel: isUser ? 'You' : 'Assistant',
                timestamp: original.timestamp || Date.now(),
                iconToggleName: isExpanded ? 'utility:end_chat' : 'utility:chat',
                iconToggleTitle: isExpanded ? 'Show fewer details' : 'Show more details',
                conciseContentClass: `v3-concise-content ${isExpanded ? 'collapsed' : ''}`,
                fullContentClass: `v3-full-content ${isExpanded ? 'expanded' : ''}`,
                isExpandedForView: isExpanded,
                // NBA properties
                suggestedAgentActions,
                suggestedUserActions,
                executedAgentActions,
                hasAnyAction: !!(suggestedAgentActions?.length || suggestedUserActions?.length || executedAgentActions?.length)
            };
        });
    }

    get hasMessages() { return (this.messages || []).length > 0; }

    get showChatInput() {
        return this._showInputBox;
    }

    get showLoader() {
        // Show loader on initial load OR when thinking about a subsequent response
        return (this._isInitiallyLoading && !this.hasMessages) || (this.isThinking && this.hasMessages);
    }

    get containerStyle() {
        const h = Number(this.containerHeight) > 0 ? Number(this.containerHeight) : 350;
        return `height:${h}px;`;
    }

    get isThinkingLatestMessage() {
        return this.isThinking && this.hasMessages;
    }

    /* =============================================================
     * Channel helpers
     * =========================================================== */
   /* get isVoiceChannel() {
        if (!this.recordId || this.recordId.length < 3) return false;
        const prefix = this.recordId.substring(0, 3).toLowerCase();
        return prefix === '0lq';
    }*/

    /* =============================================================
     * Toggle view handler for concise/full
     * =========================================================== */
    handleToggleView(event) {
        const msgId = event.currentTarget.dataset.messageId;
        this.messages = this.messages.map(m => (m.id === msgId ? { ...m, isExpandedForView: !m.isExpandedForView } : m));
    }

    /* =============================================================
     * Event handlers – manual input
     * =========================================================== */
    handleInputChange(event) {
        this.chatInput = event.target.value;
    }

    handleInputKeyDown(event) {
        if (event.key === 'Enter' && !event.shiftKey) {
            event.preventDefault();
            this.handleSend();
        }
    }

    handleSend() {
        const text = (this.chatInput || '').trim();
        if (!text) {
            return;
        }
        this.chatInput = '';
        this._addMessage(text, ROLE_USER);
        this._sendRequestToFlow(text);
    }

    /* =============================================================
     * Flow invocation logic
     * =========================================================== */
    _sendRequestToFlow(text) {
        this.isThinking = true;

        //Test to see if we can get the JSON from Omniscript here

        console.log('in _sendRequestToFlow -> jsonDef.response' + JSON.stringify(this.jsonDef.response));

        // Construct session history from all messages
        const history = (this.messages || []).map(m => ({
            role: m.role,
            content: m.payload || m.text
        }));

        console.log('sessionId is ' + this._sessionId);
        console.log('text is ' + text);

        const flowNameToUse = (this.flowApiName && this.flowApiName.trim()) || 'Omniscript_Step_Chart_Agent';
        const apexArgs = {
            recordId: this.recordId || '',
            sessionId: this._sessionId || '',
            requestText: text,
            osJSON: JSON.stringify(this.jsonDef.response),
            sessionHistory: JSON.stringify(history),

            flowApiName: flowNameToUse
        };

        invokeFlow(apexArgs)
        .then(result => {
            this.isThinking = false;
            this._isInitiallyLoading = false;
            if (result) {
                if (result.sessionId) {
                    this._sessionId = result.sessionId;
                }
                if (result.response) {
                    try {
                        // Parse the outer wrapper object
                        // Check to see if it's valid JSON if so then we use that to update Omniscript JSON
                        result.response = this.cleanString(result.response);
                        const wrapper = JSON.parse(result.response);

                        console.log('Response is valid JSON.  Update Omniscript JSON');
                        console.log('result.response is ' + result.response);
                        this.omniApplyCallResp(wrapper);
                        this._addMessage("I have attempted to fill out the application please review the details", ROLE_ASSISTANT);
                        
                    } catch (e) {
                        // Response was not valid JSON, treat as plain text
                        this._showInputBox = true;
                        this._addMessage(result.response, ROLE_ASSISTANT);
                        console.log('Response was plain text', e);
                    }
                }
            }
        })
        .catch(error => {
        this.isThinking = false;
            this._isInitiallyLoading = false;
            this._showInputBox = false; // Hide on error
            console.error('Error invoking flow:', error);
            let errorMessage = 'An error occurred.';
            if (error && error.body && error.body.message) {
                errorMessage = error.body.message;
            }
            this._addMessage(`Sorry, I ran into an error: ${errorMessage}`, ROLE_ASSISTANT);
        });
    }

    /* =============================================================
     * NBA Handlers
     * =========================================================== */
    handleAgentActionClick(event) {
        const messageId = event.target.dataset.messageId;
        const actionId = event.target.dataset.actionId;
        const message = this.messages.find(m => m.id === messageId);
        if (message && message.payload.suggestedAgentActions) {
            const action = message.payload.suggestedAgentActions.find(a => a.id === actionId);
            if (action && action.actionDetails && action.actionDetails.promptText) {
                // Add a user message to the chat showing which action was taken
                this._addMessage(action.label, ROLE_USER);
                // Send the underlying prompt text to the backend for processing
                this._sendRequestToFlow(action.actionDetails.promptText);
            }
        }
    }

    handleUserActionClick(event) {
        const messageId = event.target.dataset.messageId;
        const actionId = event.target.dataset.actionId;
        const message = this.messages.find(m => m.id === messageId);
        if (message && message.payload.suggestedUserActions) {
            const action = message.payload.suggestedUserActions.find(a => a.id === actionId);
            if (action && action.actionDetails && action.actionDetails.flowApiName) {
                this.activeFlowApiName = action.actionDetails.flowApiName;
                this.flowInputVariables = action.actionDetails.inputVariables || [];
            }
        }
    }

    handleFlowStatusChange(event) {
        if (event.detail.status === 'FINISHED' || event.detail.status === 'FINISHED_SCREEN') {
            const flowApiName = event.target.flowApiName || 'the flow';

            // Reset the active flow so the component returns to the chat view
            this.activeFlowApiName = null;
            this.flowInputVariables = [];
            
            // Send a message back to the backend to inform it that the action was completed
            const messageText = `user completed the action: ${flowApiName}`;
            this._sendRequestToFlow(messageText);
        }
    }

    /* =============================================================
     * Utility functions
     * =========================================================== */
    _addMessage(text, role, payload = null) {
        const newMessage = {
            id: `msg_${Date.now()}_${Math.random()}`,
            text: text,
            role: role,
            payload: payload,
            timestamp: new Date(),
            isExpandedForView: false
        };
        this.messages = [...this.messages, newMessage];
        // Scroll to bottom after render
        requestAnimationFrame(() => {
            const chatContainer = this.template.querySelector('.v3-chat-container');
            if (chatContainer) {
                chatContainer.scrollTop = chatContainer.scrollHeight;
            }
        });
    }

    //JB Added
    render() {
        return tmpl;
    }

    cleanString(str) {
        // Remove ```json from the start if it exists
        str = str.replace(/^```json\s*/i, "");
        
        // Remove ``` from the end if it exists
        str = str.replace(/```$/, "");
        
        return str.trim();
    }

    
}