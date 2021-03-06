'use strict';

function get_min_and_max(sku) {
  var min = false;
  var max = false;
  var sku = sku.toString();
  if (sku.slice(0, 2) === '71' || sku.slice(0, 2) === '75') {
    if (sku.slice(0, 2) === '71' && sku !== '71-000') {
      min = '5';
      max = false;
    } else if (sku.slice(-1) === 'A') {
      min = '5';
      max = '14';
    } else if (sku.slice(-1) === 'B') {
      min = '15';
      max = '29';
    } else if (sku.slice(-1) === 'C') {
      min = '30';
      max = false;
    }
  }
  return [min, max];
}

function update_cart_tab() {
  $.ajax('/cart.js', {
    type: 'GET',
    dataType: 'json',
    success: function(data, textStatus, jqXHR) {
      var item_count = data.item_count;
      var total_price = data.total_price;
      if (item_count === 1) {
        item_count += " item";
      } else {
        item_count += " items";
      }
      $('#cart-item-count').html(item_count);
      var dollars = parseInt(total_price / 100);
      var cents = total_price % 100;
      if (cents < 10) {
        cents = '0' + cents;
      }
      total_price = '$' + Humanize.intComma(dollars) + '.' + cents;
      $('#cart-total-price').html(total_price);
    },
    error: function(jqXHR, textStatus, errorThrown) {
      console.log(errorThrown);
    }
  });
}

jQuery(function($) {
  $('td.cart-quantity input').each(function () {
    var sku = $(this).data('sku');
    var min_and_max = get_min_and_max(sku);
    var min = min_and_max[0];
    var max = min_and_max[1];
    if (min) {
      $(this).attr('min', min);
    } else {
      $(this).removeAttr('min');
    }
    if (max) {
      $(this).attr('max', max);
    } else {
      $(this).removeAttr('max');
    }
  });

  $('.add-to-cart').click(function(evt) {
    var sku = $(evt.target).data('sku');
    var id = $(evt.target).data('id');
    var name = $.trim($(evt.target).data('name'));
    $('#add-to-cart-modal input[name=sku]').val(sku);
    $('#add-to-cart-modal input[name=id]').val(id);
    $('#add-to-cart-modal .product').html(name);
    var min_and_max = get_min_and_max(sku);
    var min = min_and_max[0];
    var max = min_and_max[1];
    if (min) {
      $('#add-to-cart-modal input[name=number]').attr('min', min);
      $('#add-to-cart-modal input[name=number]').attr('value', min);
    } else {
      $('#add-to-cart-modal input[name=number]').removeAttr('min');
      $('#add-to-cart-modal input[name=number]').attr('value', 1);
    }
    if (max) {
      $('#add-to-cart-modal input[name=number]').attr('max', max);
    } else {
      $('#add-to-cart-modal input[name=number]').removeAttr('max');
    }
    $('#add-to-cart-modal').modal('show');
  });
  $('#add-to-cart-modal').on('hidden', function() {
    $('#add-to-cart-errors').html('');
    // Remove special case for Poly Plain Weave and Linens:
    $('#add-to-cart-modal input[name=number]').attr('min', '1');
    $('#add-to-cart-modal input[name=number]').attr('value', '1');
  });
  $('#add-to-cart-form').submit(function(evt) {
    $.ajax(
      '/cart/add.js',
      {
        type: 'POST',
        data: {
          quantity: $('#add-to-cart-form input[name=number]').val(),
          id: $('#add-to-cart-form input[name=id]').val()
        },
        dataType: "text", /* Any escaped sequences in the JSON returned by Shopify cause jQuery's JSON parser to die, turning success into failure. So since we don't need the JSON, we ignore it thus. */
        success: function(data, textStatus, jqXHR) {
          $('#add-to-cart-modal').modal('hide');
          update_cart_tab();
        },
        error: function(jqXHR, textStatus, errorThrown) {
          var response_as_json = $.parseJSON(jqXHR.responseText);
          var error_node = $('<div class="alert alert-error">');
          error_node.html(response_as_json.description);
          $('#add-to-cart-errors').html(error_node);
        }
      }
    );
    return false;
  });
});
