<template lang="pug">
  div(v-if="config && config.retentions")
    .panel.panel-default(:class="{'panel-info': !disabled}")
      .panel-heading
        strong {{ $root.lang.settings }}
      .panel-body
        .form-group
          label(for='retention') {{ $root.lang.retention }}
          |
          select#retention.form-control(:value='retention', :disabled='disabled',
          @change="$store.commit('upload/RETENTION', $event.target.value)")
            option(
              v-for='(label, seconds) in config.retentions'
              :value="seconds"
              :selected="seconds === retention"
            ) {{ $root.lang.retentions[seconds] || label }}
        .form-group
          label(for='password') {{ $root.lang.password }}
          .input-group(:class="{'has-error': config.requireBucketPassword && !password}")
            input#password.form-control(
              type='text'
              :value='password'
              @input="$store.commit('upload/PASSWORD', $event.target.value)"
              :disabled='disabled'
              :placeholder="config.requireBucketPassword ? $root.lang.required : $root.lang.optional"
              required="config.requireBucketPassword"
            )
            span.input-group-addon(
              style='cursor: pointer'
              :title='$root.lang.generateRandomPassword'
              @click='generatePassword()'
              tabindex="0"
              role="button"
              @keydown.enter.prevent='generatePassword()'
              @keydown.space.prevent='generatePassword()'
            )
              icon(name="key")
        .form-group(:class="{'has-error': notifyEnabled && notifyEmail && !notifyEmailValid}")
          label
            input(
              type='checkbox'
              :checked='notifyEnabled'
              @change='onToggleNotify($event.target.checked)'
              :disabled='disabled'
            )
            |  Notify me by email when this is downloaded
          input#notifyEmail.form-control(
            type='email'
            :value='notifyEmail'
            @input="$store.commit('upload/NOTIFY_EMAIL', $event.target.value)"
            :disabled='disabled || !notifyEnabled'
            placeholder='you@example.com'
          )
          span.help-block(v-if="notifyEnabled && notifyEmail && !notifyEmailValid")
            | Please enter a valid email address.
</template>

<script type="text/babel">
  import { mapState } from 'vuex';
  import 'vue-awesome/icons/key';

  const passGen = {
    _pattern: /[A-Z0-9_\-+!]/,
    _getRandomByte: function() {
      const result = new Uint8Array(1);
      let fixedcrypto = window.msCrypto;
      if (!fixedcrypto) {
        fixedcrypto = window.crypto;
      }
      fixedcrypto.getRandomValues(result);
      return result[0];
    },
    generate: function(length) {
      let fixedcrypto2 = window.msCrypto;
      if (!fixedcrypto2) {
        fixedcrypto2 = window.crypto;
      }
      if (!fixedcrypto2 || !fixedcrypto2.getRandomValues) return '';
      return Array.apply(null, { 'length': length }).map(function() {
        let result;
        while (true) {
          result = String.fromCharCode(this._getRandomByte());
          if (this._pattern.test(result)) return result;
        }
      }, this).join('');
    }
  };

  export default {
    name: 'Settings',

    data() {
      return {
        notifyEnabled: false
      };
    },

    computed: {
      ...mapState({
        config: 'config',
        disabled: 'disabled',
        retention: state => state.upload.retention,
        password: state => state.upload.password,
        notifyEmail: state => state.upload.notifyEmail,
      }),
      notifyEmailValid() {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/i.test(this.notifyEmail);
      }
    },

    methods: {
      generatePassword() {
        if (this.disabled) return;
        this.$store.commit('upload/PASSWORD', passGen.generate(10));
      },
      onToggleNotify(checked) {
        this.notifyEnabled = checked;
        if (!checked) {
          this.$store.commit('upload/NOTIFY_EMAIL', '');
        }
      }
    }
  };
</script>
