import axios             from 'axios';
import GuidelineAssets   from '@/resources/GuidelineAssets';
import GuidelineSections from '@/resources/GuidelineSections';
import Hotspots          from '@/resources/Hotspots';
import HotspotTemplates  from '@/resources/HotspotTemplates';
import Previews          from '@/resources/Previews';
import ProjectLinks      from '@/resources/ProjectLinks';
import Projects          from '@/resources/Projects';
import Prototypes        from '@/resources/Prototypes';
import ScreenComments    from '@/resources/ScreenComments';
import Screens           from '@/resources/Screens';
import Users             from '@/resources/Users';

/**
 * Presentator API HTTP Client.
 *
 * @author Gani Georgiev <gani.georgiev@gmail.com>
 */
export default class Client {
    /**
     * @param {String} [baseUrl]    API base url
     * @param {String} [token]      Authorization token key
     * @param {String} [lang]       Language code
     * @param {Object} [httpConfig] HTTP client config (available settings - https://github.com/mzabriskie/axios#request-config)
     */
    constructor(baseUrl = '', token = '', lang = 'en-US', httpConfig) {
        httpConfig = (typeof httpConfig === 'object' && httpConfig !== null) ? httpConfig : {};

        // init HTTP client
        this.$http = axios.create(httpConfig);

        this.enableAutoCancellation(true);

        // handle auto cancelation for duplicated pending request
        this.$cancelSource = {};
        this.$http.interceptors.request.use((config) => {
            if (this.$enableAutoCancelation && !config.cancelToken) {
                config.cancelKey = config.cancelKey || (config.method + config.url);

                this.cancelRequest(config.cancelKey); // abort previous pending requests
                this.$cancelSource[config.cancelKey] = axios.CancelToken.source();
                config.cancelToken = this.$cancelSource[config.cancelKey].token;
            }

            return config;
        });
        this.$http.interceptors.response.use((response) => {
            this.enableAutoCancellation(true);

            // delete stored cancel source key
            delete this.$cancelSource[response.config.cancelKey];

            return response;
        }, (error) => {
            if (axios.isCancel(error)) {
                // silently reject the cancellation error...
                return Promise.reject(null);
            }

            return Promise.reject(error);
        });

        this.setBaseUrl(baseUrl);

        this.setToken(token);

        this.setLanguage(lang);

        // load all resources
        this.GuidelineAssets   = new GuidelineAssets(this.$http);
        this.GuidelineSections = new GuidelineSections(this.$http);
        this.Hotspots          = new Hotspots(this.$http);
        this.HotspotTemplates  = new HotspotTemplates(this.$http);
        this.Previews          = new Previews(this.$http);
        this.ProjectLinks      = new ProjectLinks(this.$http);
        this.Projects          = new Projects(this.$http);
        this.Prototypes        = new Prototypes(this.$http);
        this.ScreenComments    = new ScreenComments(this.$http);
        this.Screens           = new Screens(this.$http);
        this.Users             = new Users(this.$http);
    }

    /**
     * Cancels single request by its cancellation token.
     *
     * @param  {String} cancelKey
     * @return {Client}
     */
    cancelRequest(cancelKey) {
        if (this.$cancelSource[cancelKey]) {
            if (typeof this.$cancelSource[cancelKey].cancel === 'function') { // axios source
                this.$cancelSource[cancelKey].cancel();
            }

            delete this.$cancelSource[cancelKey];
        }

        return this;
    }

    /**
     * Enables or disables auto duplicated request cancellation.
     * Note: The flag is reseted after each request (default to `true`).
     *
     * @param  {Boolean} [enable] (`true` by default)
     * @return {Client}
     */
    enableAutoCancellation(enable = true) {
        this.$enableAutoCancelation = enable ? true : false;

        return this;
    }

    /**
     * Sets http client base url.
     *
     * @param  {String} url
     * @return {Client}
     */
    setBaseUrl(url) {
        this.$baseUrl = url;

        if (this.$http) {
            this.$http.defaults.baseURL = url;
        }

        return this;
    };

    /**
     * Sets global authorization token header.
     *
     * @param  {String} token
     * @return {Client}
     */
    setToken(token = '') {
        this.$token = token;

        if (!this.$http) {
            return;
        }

        if (this.$token) {
            this.$http.defaults.headers.common['Authorization'] = 'Bearer ' + this.$token;
        } else if (this.$http.defaults.headers.common['Authorization']) {
            delete this.$http.defaults.headers.common['Authorization'];
        }

        return this;
    }

    /**
     * Sets global Accept-Language header.
     *
     * @param  {String} lang
     * @return {Client}
     */
    setLanguage(lang = 'en-US') {
        this.$language = lang;

        if (!this.$http) {
            return;
        }

        if (this.$language) {
            this.$http.defaults.headers.common['Accept-Language'] = this.$language;
        } else if (this.$http.defaults.headers.common['Accept-Language']) {
            delete this.$http.defaults.headers.common['Accept-Language'];
        }

        return this;
    }
}
